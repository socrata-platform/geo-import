export
default {
  zk: ['localhost:2181'],

  log: {
    level: 'debug',
    name: 'geo-import'
  },

  amq: {
    host: 'stomp://localhost:61613,stomp://localhost:61613'
  }
};