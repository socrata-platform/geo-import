var VersionService = {
  'get': function(req, res) {
    res.status(200).send({
      'version': 0
    });
  }
};

export default VersionService;