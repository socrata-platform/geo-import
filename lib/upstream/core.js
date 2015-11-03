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

  //partial to buffer a response
  bufferResponse(onBuffered) {
    return (response) => {
      if(!response.pipe) {
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
        } catch(e) {
          response.body = buf;
        }
        onBuffered(response);
      });
    };
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
      .on('error', this._onErrorResponse(onComplete));
    }.bind(this));
  }

  addColumn(colSpec, onComplete) {
    console.log(`Add column ${colSpec} to core`);
    var [fourfour, [name, dataTypeName]] = colSpec;
    if(!name || !dataTypeName) {
      return onComplete("Invalid column, name and dataTypeName cannot be null!");
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
      .on('error', this._onErrorResponse(onComplete));

    }.bind(this));
  }


  upsert(upsertSpec, onOpened) {
    console.log("Upsert to core");
    var [_layer, fourfour] = upsertSpec;
    return this._url((err, url) => {
      if (err) return onOpened(err);
      return onOpened(false, [upsertSpec, request.post({
        url: `${url}/id/${fourfour}.json`,
        headers: this._headers()
      })]);
    });
  }
}

export {
  Core as Core, CoreAuth as CoreAuth
};