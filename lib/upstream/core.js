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

  bufferResponse(onBuffered) {
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
    return this.bufferResponse((response) => {
      if(response.statusCode > 300) return onComplete(response);
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
      .on('error', this._onErrorResponse(onComplete))
    }.bind(this));
  }

  addColumn(colSpec, onComplete) {
    var [fourfour, [name, dataTypeName]] = colSpec;
    if(!name || !dataTypeName) {
      return onComplete("Invalid column, name and dataTypeName cannot be null!")
    }

    return this._url((err, url) => {
      if (err) return onComplete(err);

      return request.post({
        url: `${url}/views/${fourfour}/columns`,
        headers: this._headers(),
        body: {
          fieldName: name,
          name: name,
          dataTypeName: dataTypeName
        },
        json: true
      })
      .on('response', this._onResponseStart(onComplete))
      .on('error', this._onErrorResponse(onComplete))

    }.bind(this));
  }


  upsert(upsertSpec, onOpened) {
    var [_layer, fourfour] = upsertSpec
    return this._url((err, url) => {
      if (err) return onOpened(err);
      return onOpened(false, [upsertSpec, request.put({
        url: `${url}/views/${fourfour}/rows`,
        headers: this._headers()
      })]);
    });
  }
}

export {
  Core as Core, CoreAuth as CoreAuth
};