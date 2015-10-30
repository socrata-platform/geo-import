import request from 'request';
import reduceStream from 'stream-reduce';

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
      'Content-Type': 'application/json'
    };
  }

  _bufferResponse(onBuffered) {
    return (response) => {
      response.pipe(reduceStream((acc, data) => {
        return acc + data.toString('utf-8')
      }, ''))
      .on('data', (buf) => {
        try {
          response.body = JSON.parse(buf)
        } catch(e) {
          response.body = buf;
        }
        onBuffered(response);
      });
    }
  }

  _onResponseStart(onComplete) {
    return this._bufferResponse((response) => {
      if(response.statusCode > 300) return onComplete(response);
      return onComplete(false, response);
    });
  }

  _onErrorResponse(onComplete) {
    return this._bufferResponse((response) => {
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
      .on('error', this._onErrorResponse(onComplete))
    }.bind(this));
  }

  addColumn(fourfour, column) {
    return this._url((err, url) => {
      if (err) return onComplete(err);

      return request.post({
        url: `${url}/views/${fourfour}/columns`,
        headers: this._headers(),
        body: column,
        json: true
      })
      .on('response', this._onResponseStart(onComplete))
      .on('error', this._onErrorResponse(onComplete))

    }.bind(this));
  }


  upsert(fourfour, onOpened) {
    return this._url((err, url) => {
      if (err) return onOpened(err);

      return onOpened(false, request.put({
        url: `${this._url()}/resources/${fourfour}/rows`,
        headers: this._headers()
      }));
    });
  }
}

export {
  Core as Core, CoreAuth as CoreAuth
};