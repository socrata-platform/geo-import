import { createRequire } from "module";
const requireJson = createRequire(import.meta.url);
const pack = requireJson("../../package.json");

var VersionService = {
  'get': function(req, res) {
    res.status(200).send({
      'name': pack.name,
      'version': pack.version
    });
  }
};

export default VersionService;
