import logger from '../util/logger';
import _ from 'underscore';

class Auth {
  constructor(message) {
    //why is the auth stuff stored in the file-type?
    //why is it escaped 3 times, so we need to JSON.parse it 3 times?
    //because reasons???????
    this._underlying = message['file-type'].auth;
  }

  get reqId() {
    return this._underlying.reqId;
  }

  get appToken() {
    return this._underlying.token;
  }

  get host() {
    return this._underlying.host;
  }

  get cookie() {
    return this._underlying.cookie;
  }

  get basic() {
    return this._underlying.auth;
  }
}


class GenClient {
  constructor(auth) {
    if (!auth) throw new Error("Client needs an auth object");
    this._auth = auth;
  }

  _log(msg) {
    logger.info({
      host: this._headers().host
    }, msg);
  }


  _headers() {
    return {
      'Authorization': this._auth.basic,
      'X-App-Token': this._auth.appToken,
      'X-Socrata-Host': this._auth.host,
      'X-Socrata-RequestId': this._auth.reqId,
      'Cookie': this._auth.cookie,
      'Content-Type': 'application/json',
      'User-Agent': 'geo-import'
    };
  }
}

export
default {
  GenClient, Auth
};