import request from 'request';
import reduceStream from 'stream-reduce';
import logger from '../util/logger';
import Layer from '../decoders/layer';
import {
  GenClient
}
from './client';
import _ from 'underscore';



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
  bufferResponse(onBuffered) {
    return (response) => {
      if (!response.pipe) {
        //this is so gross.
        //the error even will emit both error responses
        //(shouldn't 'response' do that?) as well as regular
        //errors. why? because. so this case handles a "response"
        //which is not actually a response, but something like
        //a failure to open a connection
        //so we munge the error to resemble an upstream
        //response error
        return onBuffered({
          body: response.code,
          statusCode: 503
        });
      }

      response.pipe(reduceStream((acc, data) => {
        return acc + data.toString('utf-8');
      }, ''))
        .on('data', (buf) => {
          try {
            response.body = JSON.parse(buf);
          } catch (e) {
            response.body = buf;
          }
          onBuffered(response);
        });
    };
  }

  _onResponseStart(onComplete) {
    return this.bufferResponse((response) => {
      if (response.statusCode > 300) return onComplete(response);
      return onComplete(false, response);
    });
  }

  _onErrorResponse(onComplete) {
    return this.bufferResponse((response) => {
      return onComplete(response, false);
    });
  }

  destroy(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);
      this._log('DeleteDataset');
      request.del({
        url: `${url}/views/${layer.uid}`,
        headers: this._headers(),
        json: true
      })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }

  get(uid, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`Looking up view ${uid}`);
      request.get({
        url: `${url}/views/${uid}`,
        headers: this._headers()
      })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }

  create(parentUid, publicationGroup, layer, onComplete) {
    if(layer.uid !== Layer.EMPTY) {
      logger.warn(`Layer uid is not empty, layer uid is ${layer.uid}, cannot create layer in datastore!`);
    }
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`CreateDataset request to core`);
      request.post({
        url: `${url}/views?nbe=true`,
        headers: this._headers(),
        body: {
          name: layer.name,
          displayType: 'geoRows',
          privateMetadata: {
            isNbe: true,
            parentUid
          },
          publicationGroup
        },
        json: true
      })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }


  replace(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`CopySchema request for new layer to core ${layer.uid}`);
      request.post({
        url: `${url}/views/${layer.uid}/publication?method=copySchema`,
        headers: this._headers()
      })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }

  publish(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`Publishing layer ${layer.uid}`);
      request.post({
        url: `${url}/views/${layer.uid}/publication`,
        headers: this._headers(),
      })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }


  // "namespace" -> NewBackEnd.resourceName(parent),
  // "owsUrl" -> s"/api/geospatial/${parent.getUid}",
  // "layers" -> publishedLayers.map { v => v.getUid }.mkString(","),
  // "isNbe" -> true,
  // "bboxCrs" -> defaultCrsCode,
  // "featureIdAttribute" -> "_SocrataID",
  // "bbox" -> bbox.toString
  updateMetadata(fourfour, layers, bbox, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      this._log(`Updating metadata for layer ${fourfour}`);
      request.put({
        url: `${url}/views/${fourfour}`,
        headers: this._headers(),
        json: true,
        body: {
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
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }


  addColumn(colSpec, onComplete) {
    var [fourfour, column] = colSpec;
    this._log(`Add column ${fourfour} ${JSON.stringify(column.toJSON())} to core`);

    return this._url((err, url) => {
      if (err) return onComplete(err);

      return request.post({
          url: `${url}/views/${fourfour}/columns`,
          headers: this._headers(),
          body: column.toJSON(),
          json: true
        })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }

  getColumns(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      return request.get({
          url: `${url}/views/${layer.uid}/columns`,
          headers: this._headers()
        })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }

  deleteColumn(colSpec, onComplete) {
    var [viewId, colId] = colSpec;
    this._log(`Delete column ${viewId} ${colId} from core`);

    return this._url((err, url) => {
      if (err) return onComplete(err);

      return request.del({
          url: `${url}/views/${viewId}/columns/${colId}`,
          headers: this._headers()
        })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
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
