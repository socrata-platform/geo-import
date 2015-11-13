import fs from 'fs';

class Disk {
  constructor(response) {
    this._response = response;

    this._allocations = [];
    this._response.on('finish', this._cleanup.bind(this));
  }

  _cleanup() {
    this._allocations.forEach((name) => {
      return
      var warn = () => {
        //TODO log this
        return `Failed to clean up ${name}`;
      };

      fs.stat(name, (err, stat) => {
        if(err) return warn();

        if(stat.isDirectory()) {
          fs.rmdir(name, (err) => {
            if(err) return warn();
          });
        } else {
          fs.unlink(name, (err) => {
            if(err) return warn();
          });
        }
      });
    });
  }

  allocate(name, opts) {
    this._allocations.push(name);
    return fs.createWriteStream(name, opts || {});
  }
}


export default Disk;