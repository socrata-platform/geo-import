import request from 'request';
import reduceStream from 'stream-reduce';
import logger from '../util/logger';

class CoreAuth {
  constructor(request) {
    this._headers = request.headers;
  }

  get authToken() {
    return this._headers['authorization']; //jshint ignore:line
  }

  get appToken() {
    return this._headers['x-app-token'];
  }

  get host() {
    return this._headers['x-socrata-host'];
  }

  get cookie() {
    return this._headers.cookie;
  }
}


class Core {
  constructor(auth, zookeeper) {
    if (!auth || !zookeeper) throw new Error("Core-Client needs auth and zookeeper");
    this._auth = auth;
    this._zk = zookeeper;
  }

  _url(cb) {
    return this._zk.getCore(cb);
  }

  _headers() {
    return {
      'Authorization': this._auth.authToken,
      'X-App-Token': this._auth.appToken,
      'X-Socrata-Host': this._auth.host,
      'Cookie': this._auth.cookie,
      'Content-Type': 'application/json'
    };
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

  create(layer, onComplete) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      request.post({
          url: `${url}/views?nbe=true`,
          headers: this._headers(),
          body: {
            name: layer.name
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

      logger.info(`CopySchema request for ${layer.uid} to core`);
      request.post({
          url: `${url}/views/${layer.uid}/publication?method=copySchema`,
          headers: this._headers()
        })
        .on('response', this._onResponseStart(onComplete))
        .on('error', this._onErrorResponse(onComplete));
    });
  }

  addColumn(colSpec, onComplete) {
    var [fourfour, column] = colSpec;
    logger.info(`Add column ${fourfour} ${JSON.stringify(column.toJSON())} to core`);

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
    logger.info(`Delete column ${viewId} ${colId} from core`);

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
    logger.info(`Upsert to core ${layer.uid}`);
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
}

export {
  Core as Core, CoreAuth as CoreAuth
};