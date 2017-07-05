import request from 'request';
import Layer from '../decoders/layer';
import logger from '../util/logger';
import _ from 'underscore';
import config from '../config';
import CoreClient from './core-client';
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

class Core extends CoreClient {
  constructor(auth, zk, log) {
    super(zk, log);
    if (!auth) throw new Error("Client needs an auth object");
    this._auth = auth;
  }

  get host() {
    return this._auth.host;
  }

  get reqId() {
    return this._auth.reqId;
  }

  headers() {
    return this._auth.headers();
  }

  destroy(layer, onComplete) {
    return this.url((err, url) => {
      if (err) return onComplete(err);
      this.info('DeleteDataset');
      request.del({
        url: `${url}/views/${layer.uid}`,
        timeout,
        headers: this.headers(),
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
    return this.url((err, url) => {
      if (err) return onComplete(err);
      this.info(`CreateDataset request to core to make child view of ${parentUid}`);

      request.post({
        url: `${url}/views?nbe=true`,
        timeout,
        headers: this.headers(),
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
    return this.url((err, url) => {
      if (err) return onComplete(err);
      this.info(`CopySchema request for new layer to core ${layer.uid}`);

      request.post({
        url: `${url}/views/${layer.uid}/publication?method=copySchema`,
        timeout,
        headers: this.headers()
      })
      .on('response', this._onResponseStart(onComplete, CreateWorkingCopyError))
      .on('error', this._onErrorResponse(onComplete, CreateWorkingCopyError));
    });
  }

  publish(layer, onComplete) {
    return this.url((err, url) => {
      if (err) return onComplete(err);

      this.info(`Publishing layer ${layer.uid}`);
      request.post({
        url: `${url}/views/${layer.uid}/publication`,
        timeout,
        headers: this.headers(),
      })
      .on('response', this._onResponseStart(onComplete, PublicationError))
      .on('error', this._onErrorResponse(onComplete, PublicationError));
    });
  }


  getView(fourfour, onComplete) {
    return this.url((err, url) => {
      if (err) return onComplete(err);

      this.info(`Getting the view: ${fourfour}`);

      request.get({
        url: `${url}/views/${fourfour}`,
        timeout,
        headers: this.headers(),
        json: true
      })
      .on('response', this._onResponseStart(onComplete, UpdateMetadataError))
      .on('error', this._onErrorResponse(onComplete, UpdateMetadataError));
    });
  }

  updateMetadata(fourfour, metadata, privateMetadata, onComplete) {
    return this.url((err, url) => {
      if (err) return onComplete(err);

      this.info(`Updating metadata for layer ${fourfour}`);
      request.put({
        url: `${url}/views/${fourfour}`,
        timeout,
        headers: this.headers(),
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

    return this.url((err, url) => {
      if (err) return onComplete(err);

      return request.post({
          url: `${url}/views/${fourfour}/columns`,
          timeout,
          headers: this.headers(),
          body: column.toJSON(),
          json: true
        })
        .on('response', this._onResponseStart(onComplete, CreateColumnError))
        .on('error', this._onErrorResponse(onComplete, CreateColumnError));
    });
  }

  getColumns(layer, onComplete) {
    return this.url((err, url) => {
      if (err) return onComplete(err);
      this.info(`Getting columns`);

      return request.get({
          url: `${url}/views/${layer.uid}/columns`,
          timeout,
          headers: this.headers()
        })
        .on('response', this._onResponseStart(onComplete, GetColumnError))
        .on('error', this._onErrorResponse(onComplete, GetColumnError));
    });
  }

  deleteColumn(colSpec, onComplete) {
    var [viewId, colId] = colSpec;
    this.info(`Delete column ${viewId} ${colId} from core`);

    return this.url((err, url) => {
      if (err) return onComplete(err);

      return request.del({
          url: `${url}/views/${viewId}/columns/${colId}`,
          timeout,
          headers: this.headers()
        })
        .on('response', this._onResponseStart(onComplete, DeleteColumnError))
        .on('error', this._onErrorResponse(onComplete, DeleteColumnError));
    });
  }


  upsert(layer, onOpened) {
    return this.url((err, url) => {
      if (err) return onOpened(err);

      var upsertOpener = () => {
        this.info(`Upsert to core ${layer.uid}`);
        return request.post({
          url: `${url}/id/${layer.uid}.json`,
          headers: this.headers()
        });
      };
      return onOpened(false, [layer, upsertOpener]);
    });
  }

  getBlob(blobId, onOpened) {
    return this.url((err, url) => {
      if (err) return onOpened(err);

      const uri = `${url}/file_data/${blobId}`;
      this.info(`Getting blob: ${uri} from core`);
      var stream = request.get({
        url: uri,
        timeout,
        headers: _.extend(
          this.headers(), {}
        )
      });
      return onOpened(false, stream);
    });
  }

  setBlob(viewId, blobId, blobName, onComplete) {
    return this.url((err, url) => {
      if (err) return onOpened(err);
      const uri = `${url}/views/${viewId}?method=setBlob&blobId=${blobId}&blobName=${encodeURI(blobName)}`;
      this.info(`Setting blob on ${uri} ${viewId} to ${blobId}`);
      request.put({
        url: uri,
        headers: this.headers(),
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
