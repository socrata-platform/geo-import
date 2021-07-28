var pack = require("../../package");

var VersionService = {
  'get': function(req, res) {
    res.status(200).send({
      'name': pack.name,
      'version': pack.version
    });
  }
};

export default VersionService;
