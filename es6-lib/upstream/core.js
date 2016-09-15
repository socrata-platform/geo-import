import request from 'request';
import reduceStream from 'stream-reduce';
import logger from '../util/logger';
import Layer from '../decoders/layer';
import {
  GenClient
}
from './client';
import _ from 'underscore';
import config from '../config';
import {
  ZKError,
  CreateDatasetError,
  CreateWorkingCopyError,
  CreateColumnError,
  PublicationError,
  GetColumnError,
  DeleteColumnError,
  UpdateMetadataError,
  CleanupError
}
from '../errors';

const timeout = config().upstreamTimeoutMs;


class Core extends GenClient {
  constructor(auth, zookeeper) {
    super(auth, zookeeper);
    if (!zookeeper) throw new Error("Core-Client needs zookeeper");
    this._zk = zookeeper;
  }

  _url(cb) {
    return this._zk.getCore(cb);
  }

  //partial to buffer a response
  bufferResponse(onBuffered, errorType) {
    return (response) => {
      if (!response.pipe) {
        logger.error(`Request failed ${response.code}`);
        //this is so gross.
        //the error even will emit both error responses
        //(shouldn't 'response' do that?) as well as regular
        //errors. why? because. so this case handles a "response"
        //which is not actually a response, but something like
        //a failure to open a connection
        //so we munge the error to resemble an upstream
        //response error
        return onBuffered(new errorType(503, response.code));
      }

      response.pipe(reduceStream((acc, data) => {
        return acc + data.toString('utf-8');
      }, ''))
        .on('data', (buf) => {
          var body = {};
          try {
            body = JSON.parse(buf);
          } catch (e) {
            body = buf;
          }

          if (response.statusCode > 300) {
            return onBuffered(new errorType(response.statusCode, body));
          }
          return onBuffered(false, body);
        });
    };
  }

  _onResponseStart(onComplete, errorType) {
    return this.bufferResponse(onComplete, errorType);
  }

  _onErrorResponse(onComplete, errorType) {
    return _.once(this.bufferResponse(onComplete, errorType));
  }

  destroy(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);
      this._log('DeleteDataset');
      request.del({
        url: `${url}/views/${layer.uid}`,
        timeout,
        headers: this._headers(),
        json: true
      })
        .on('response', this._onResponseStart(onComplete, CleanupError))
        .on('error', this._onErrorResponse(onComplete, CleanupError));
    });
  }

  create(parentUid, layer, onComplete) {
    if (layer.uid !== Layer.EMPTY) {
      logger.warn(`Layer uid is not empty, layer uid is ${layer.uid}, cannot create layer in datastore!`);
    }
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`CreateDataset request to core`);
      request.post({
        url: `${url}/views?nbe=true`,
        timeout,
        headers: this._headers(),
        body: {
          name: layer.name,
          displayType: 'geoRows',
          privateMetadata: {
            isNbe: true,
            parentUid
          }
        },
        json: true
      })
        .on('response', this._onResponseStart(onComplete, CreateDatasetError))
        .on('error', this._onErrorResponse(onComplete, CreateDatasetError));
    });
  }


  replace(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`CopySchema request for new layer to core ${layer.uid}`);
      request.post({
        url: `${url}/views/${layer.uid}/publication?method=copySchema`,
        timeout,
        headers: this._headers()
      })
        .on('response', this._onResponseStart(onComplete, CreateWorkingCopyError))
        .on('error', this._onErrorResponse(onComplete, CreateWorkingCopyError));
    });
  }

  publish(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`Publishing layer ${layer.uid}`);
      request.post({
        url: `${url}/views/${layer.uid}/publication`,
        timeout,
        headers: this._headers(),
      })
        .on('response', this._onResponseStart(onComplete, PublicationError))
        .on('error', this._onErrorResponse(onComplete, PublicationError));
    });
  }

  updateMetadata(fourfour, layers, bbox, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`Updating metadata for layer ${fourfour}`);
      request.put({
        url: `${url}/views/${fourfour}`,
        timeout,
        headers: this._headers(),
        json: true,
        body: {
          displayType: 'map',
          metadata: {
            geo: {
              owsUrl: `/api/geospatial/${fourfour}`,
              layers: layers.map(l => l.uid).join(','),
              isNbe: true,
              bboxCrs: 'EPSG:4326',
              namespace: `_${fourfour}`,
              featureIdAttribute: '_SocrataID',
              bbox: bbox.toString()
            }
          },
          privateMetadata: {
            childViews: layers.map(l => l.uid)
          }
        }
      })
        .on('response', this._onResponseStart(onComplete, UpdateMetadataError))
        .on('error', this._onErrorResponse(onComplete, UpdateMetadataError));
    });
  }


  addColumn(colSpec, onComplete) {
    var [fourfour, column] = colSpec;
    this._log(`Add column ${fourfour} ${JSON.stringify(column.toJSON())} to core`);

    return this._url((err, url) => {
      if (err) return onComplete(err);

      return request.post({
          url: `${url}/views/${fourfour}/columns`,
          timeout,
          headers: this._headers(),
          body: column.toJSON(),
          json: true
        })
        .on('response', this._onResponseStart(onComplete, CreateColumnError))
        .on('error', this._onErrorResponse(onComplete, CreateColumnError));
    });
  }

  getColumns(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      return request.get({
          url: `${url}/views/${layer.uid}/columns`,
          timeout,
          headers: this._headers()
        })
        .on('response', this._onResponseStart(onComplete, GetColumnError))
        .on('error', this._onErrorResponse(onComplete, GetColumnError));
    });
  }

  deleteColumn(colSpec, onComplete) {
    var [viewId, colId] = colSpec;
    this._log(`Delete column ${viewId} ${colId} from core`);

    return this._url((err, url) => {
      if (err) return onComplete(err);

      return request.del({
          url: `${url}/views/${viewId}/columns/${colId}`,
          timeout,
          headers: this._headers()
        })
        .on('response', this._onResponseStart(onComplete, DeleteColumnError))
        .on('error', this._onErrorResponse(onComplete, DeleteColumnError));
    });
  }


  upsert(layer, onOpened) {
    this._log(`Upsert to core ${layer.uid}`);
    return this._url((err, url) => {
      if (err) return onOpened(err);

      var upsertOpener = () => {
        return request.post({
          url: `${url}/id/${layer.uid}.json`,
          headers: this._headers()
        });
      };
      return onOpened(false, [layer, upsertOpener]);
    });
  }

  getBlob(blobId, onOpened) {
    return this._url((err, url) => {
      if (err) return onOpened(err);

      const uri = `${url}/file_data/${blobId}`;
      this._log(`Getting blob: ${uri} from core`);
      var stream = request.get({
        url: uri,
        timeout,
        encoding: null,
        headers: _.extend(
          this._headers(), {}
        )
      });
      return onOpened(false, stream);
    });
  }

}

export
default Core;