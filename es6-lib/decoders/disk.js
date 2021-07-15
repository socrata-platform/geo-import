import fs from 'fs';

class Disk {
  constructor(scope, logger) {
    this._scope = scope;

    this._allocations = [];
    this.log = logger;
    this._scope.once('finish', this._cleanup.bind(this));
  }

  _cleanup() {
    this._allocations.forEach((name) => {
      var warn = () => {
        return this.log.warn(`Failed to clean up ${name}`);
      };

      fs.stat(name, (err, stat) => {
        if(err) return warn();

        if(stat.isDirectory()) {
          this.log.info(`Removing allocated dir ${name}`);
          fs.rmdir(name, (err) => {
            if(err) return warn();
          });
        } else {
          this.log.info(`Removing allocated file ${name}`);
          fs.unlink(name, (err) => {
            if(err) return warn();
          });
        }
      });
    });
  }

  allocate(name, opts) {
    this.log.info(`Allocating file ${name}`);
    this._allocations.push(name);
    return fs.createWriteStream(name, opts || {});
  }


}

export default Disk;
