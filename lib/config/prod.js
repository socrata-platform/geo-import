var zkEnsemble;
var envZk = process.env.ZOOKEEPER_ENSEMBLE;
try {
  zkEnsemble = JSON.parse(envZk);
} catch (e) {
  throw new Error(`Failed to parse ZOOKEEPER_ENSEMBLE environment variable ${envZk}`);
}

if(!zkEnsemble) throw new Error(`Invalid ZOOKEEPER_ENSEMBLE environment variable ${envZk}`);

export default {
  zk: zkEnsemble,

  log: {
    level: 'debug',
    name: 'geo-import'
  }
};