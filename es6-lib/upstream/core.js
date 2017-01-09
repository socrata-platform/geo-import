import request from 'request';
import reduceStream from 'stream-reduce';
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
  SetBlobError,
  UpdateMetadataError,
  CleanupError
}
from '../errors';

const timeout = config().upstreamTimeoutMs;


class Core extends GenClient {
  constructor(auth, zookeeper, logger) {
    super(auth, zookeeper);
    if (!zookeeper) throw new Error("Core-Client needs zookeeper");
    this._zk = zookeeper;
    this.log = logger;
  }

  _url(cb) {
    return this._zk.getCore(cb);
  }

  //partial to buffer a response
  bufferResponse(onBuffered, errorType) {
    return (response) => {
      if (!response.pipe) {
        this.error(`Request failed ${response.code}`);
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

  info(message) {
    this.log.info(this.logMeta(), message);
  }

  error(message) {
    this.log.error(this.logMeta(), message);
  }

  destroy(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);
      this.info('DeleteDataset');
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
      this.error(`Layer uid is not empty, layer uid is ${layer.uid}, cannot create layer in datastore!`);
    }
    return this._url((err, url) => {
      if (err) return onComplete(err);
      this.info(`CreateDataset request to core to make child view of ${parentUid}`);

      request.post({
        url: `${url}/views?nbe=true`,
        timeout,
        headers: this._headers(),
        body: {
          name: layer.name,
          displayType: 'geoRows',
          privateMetadata: {
            isNbe: true,
            geo: {
              parentUid
            }
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
      this.info(`CopySchema request for new layer to core ${layer.uid}`);

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

      this.info(`Publishing layer ${layer.uid}`);
      request.post({
        url: `${url}/views/${layer.uid}/publication`,
        timeout,
        headers: this._headers(),
      })
        .on('response', this._onResponseStart(onComplete, PublicationError))
        .on('error', this._onErrorResponse(onComplete, PublicationError));
    });
  }


  getView(fourfour, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this.info(`Getting the view: ${fourfour}`);

      request.get({
        url: `${url}/views/${fourfour}`,
        timeout,
        headers: this._headers(),
        json: true
      })
      .on('response', this._onResponseStart(onComplete, UpdateMetadataError))
      .on('error', this._onErrorResponse(onComplete, UpdateMetadataError));
    });
  }

  updateMetadata(fourfour, metadata, privateMetadata, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this.info(`Updating metadata for layer ${fourfour}`);
      request.put({
        url: `${url}/views/${fourfour}`,
        timeout,
        headers: this._headers(),
        json: true,
        body: {
          displayType: 'map',
          metadata,
          privateMetadata
        }
      })
      .on('response', this._onResponseStart(onComplete, UpdateMetadataError))
      .on('error', this._onErrorResponse(onComplete, UpdateMetadataError));
    });
  }


  addColumn(colSpec, onComplete) {
    var [fourfour, column] = colSpec;
    this.info(`Add column ${fourfour} ${JSON.stringify(column.toJSON())} to core`);

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
      this.info(`Getting columns`);

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
    this.info(`Delete column ${viewId} ${colId} from core`);

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
    return this._url((err, url) => {
      if (err) return onOpened(err);

      var upsertOpener = () => {
        this.info(`Upsert to core ${layer.uid}`);
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
      this.info(`Getting blob: ${uri} from core`);
      var stream = request.get({
        url: uri,
        timeout,
        headers: _.extend(
          this._headers(), {}
        )
      });
      return onOpened(false, stream);
    });
  }

  setBlob(viewId, blobId, blobName, onComplete) {
    return this._url((err, url) => {
      if (err) return onOpened(err);

      const uri = `${url}/views/${viewId}?method=setBlob&blobId=${blobId}&blobName=${blobName}`;
      this.info(`Setting blob on ${uri} ${viewId} to ${blobId}`);
      request.put({
        url: uri,
        headers: this._headers(),
        timeout,
        json: true
      })
      .on('response', this._onResponseStart(onComplete, SetBlobError))
      .on('error', this._onErrorResponse(onComplete, SetBlobError));
    });
  }

}

export
default Core;
