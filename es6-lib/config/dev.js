

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
