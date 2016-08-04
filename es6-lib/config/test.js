export
default {
  port: 6665,

  //abbreviate summaries at 50kb
  abbreviateSummarySize: 50 * 1000,

  zk: ["localhost:2181"],
  log: {
    level: 'critical',
    name: 'geo-import'
  },
  amq: {
    host: 'stomp://localhost:61613,stomp://localhost:61613'
  }
};