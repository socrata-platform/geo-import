if (!process.env.SOCRATA_LOCAL_USER) {
  throw new Error('No SOCRATA_LOCAL_USER environment variable set! Please set it and SOCRATA_LOCAL_PASS.');
}

if (!process.env.SOCRATA_LOCAL_PASS) {
  throw new Error('No SOCRATA_LOCAL_PASS environment variable set! Please set it.');
}

export default {
  zk: ['localhost:2181'],

  log: {
    level: 'debug',
    name: 'geo-import'
  },

  soda: {
    username: process.env.SOCRATA_LOCAL_USER,
    password: process.env.SOCRATA_LOCAL_PASS
  },

  amq: {
    host: 'stomp://localhost:61613,stomp://localhost:61613'
  }
};

