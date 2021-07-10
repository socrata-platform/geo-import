import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pack = require("../../package.json")

var VersionService = {
  'get': function(req, res) {
    res.status(200).send({
      'name': pack.name,
      'version': pack.version
    });
  }
};

export default VersionService;
