var pack = require('../../package.json');

var VersionService = {
  'get': function(req, res) {
    res.status(200).send({
      'name': pack.name,
      'version': pack.version
    });
  }
};

export default VersionService;
