import CoreClient from './core-client';
import request from 'request';
import {
  AuthenticationError
}
from '../errors';
import config from '../config';
const conf = config();
const timeout = conf.upstreamTimeoutMs;
const {username, password} = conf.soda;

class Auth extends CoreClient {
  constructor(message, zk, logger) {
    super(zk);
    // why is the auth stuff stored in the file-type?
    // why is it escaped 3 times, so we need to JSON.parse it 3 times?
    // because reasons???????
    this._underlying = message['file-type'].auth;
    this._userId = message.user;
    this.log = logger;
  }

  get reqId() {
    return this._underlying.reqId;
  }

  get host() {
    return this._underlying.host;
  }

  get basic() {
    return this._underlying.auth;
  }

  get spoofee() {
    return this._spoofee;
  }

  headers() {
    return {
      'X-Socrata-Host': this.host,
      'X-Socrata-RequestId': this.reqId,
      'Cookie': this.cookie,
      'Content-Type': 'application/json',
      'User-Agent': 'geo-import'
    };
  }


  spoof(onComplete) {
    return this.url((err, url) => {
      if(err) return onComplete(err);

      request({
        method: 'GET',
        url: `${url}/users/${this._userId}`,
        auth: {
          user: username,
          pass: password
        },
        timeout,
        headers: {
          'X-Socrata-Host': this.host
        },
        json: true
      }, (err, response, {email}) => {
        if(err) return onComplete(err);
        this.log.info(`Authenticating as ${email} using ${username}`);

        request({
          method: 'POST',
          url: `${url}/authenticate`,
          timeout,
          form: {
            username: `${email} ${username}`,
            password
          },
          headers: {
            'X-Socrata-Host': this.host
          }
        }, (err, response, body) => {
          if(err) onComplete(new AuthenticationError(response.statusCode, body));
          this.cookie = response.headers['set-cookie'];
          this.log.info(`Successfully spoofed ${email}`);
          onComplete();
        });
      });
    });

  }
}

export default Auth;
