import reduceStream from 'stream-reduce';
import _ from 'underscore';

class CoreClient {
  constructor(zk, log) {
    if (!zk) throw new Error("Core-Client needs zookeeper");
    this._zk = zk;
    this.log = log;
  }

  url(cb) {
    return this._zk.getCore(cb);
  }

  logMeta() {
    return {
      host: this.host,
      request_id: this.reqId
    };
  }

  info(message) {
    this.log.info(this.logMeta(), message);
  }

  error(message) {
    this.log.error(this.logMeta(), message);
  }

  //partial to buffer a response
  bufferResponse(onBuffered, errorType, retry) {
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

          if (response.statusCode === 403 && retry) {
            return this.auth.spoof(() => {
              return retry();
            });
          }

          if (response.statusCode > 300) {
            return onBuffered(new errorType(response.statusCode, body));
          }
          return onBuffered(false, body);
        });
    };
  }

  _onResponseStart(onComplete, errorType, retry) {
    return this.bufferResponse(onComplete, errorType, retry);
  }

  _onErrorResponse(onComplete, errorType, retry) {
    return _.once(this.bufferResponse(onComplete, errorType, retry));
  }
}

export default CoreClient;
