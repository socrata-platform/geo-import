import fs from 'fs';
import logger from '../util/logger';


class Disk {
  constructor(scope) {
    this._scope = scope;

    this._allocations = [];

    this._scope.once('finish', this._cleanup.bind(this));
  }

  _cleanup() {
    this._allocations.forEach((name) => {
      var warn = () => {
        return logger.warn(`Failed to clean up ${name}`);
      };

      fs.stat(name, (err, stat) => {
        if(err) return warn();

        if(stat.isDirectory()) {
          logger.info(`Removing allocated dir ${name}`);
          fs.rmdir(name, (err) => {
            if(err) return warn();
          });
        } else {
          logger.info(`Removing allocated file ${name}`);
          fs.unlink(name, (err) => {
            if(err) return warn();
          });
        }
      });
    });
  }

  allocate(name, opts) {
    logger.info(`Allocating file ${name}`);
    this._allocations.push(name);
    return fs.createWriteStream(name, opts || {});
  }


}


export default Disk;