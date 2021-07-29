var zkEnsemble;
const envZk = process.env.ZOOKEEPER_ENSEMBLE;
const amqUrl = process.env.AMQ_URL;

try {
  zkEnsemble = JSON.parse(envZk);
} catch (e) {
  throw new Error(`Failed to parse ZOOKEEPER_ENSEMBLE environment variable ${envZk}`);
}

if(!zkEnsemble) throw new Error(`Invalid ZOOKEEPER_ENSEMBLE environment variable ${envZk}`);

export default {
  zk: zkEnsemble,
  rowBufferSize: 2,
  log: {
    level: 'debug',
    name: 'geo-import'
  },
  soda: {
    username: process.env.SOCRATA_USER,
    password: process.env.SOCRATA_PASSWORD
  },
  heapDumpOut: '/app',
  amq: {
    host: amqUrl
  }
};
