export
default {
  port: 4445,

  //gate at which the service will not read the whole file to generate
  //a detailed summary. for files over this limit, an abbreviated summary
  //will be returned, which is much faster, but less helpful
  abbreviateSummarySize: 10 * 1000 * 1000000, //a lot of bytes

  //when the merger writes to layers, the layer will spill rows to the .ldjson
  //scratch file after this amount. note that this is per layer!
  //so if we have 100 layers,
  //and spillRowsToDiskAfter is 500, then we are keeping 100*500 rows
  //in memory.
  spillRowsToDiskAfter: 20,

  socketTimeoutMs: 60 * 1000,

  //this doesn't apply to upserts, but it can take minutes?? to do
  //ddl... ;_;
  upstreamTimeoutMs: 2 * 60 * 1000,

  //number of rows to buffer in object mode feature streams
  rowBufferSize: 20,

  //maximum number of points to allow through the importer per row
  maxVerticesPerRow: 1000000,

  metrics: {
    heapMonitorInterval: 500,
  },
  heapDumpOut: '.',

  emitProgressEveryRows: 20,
  //don't send more than 1 ISS progress event within this time window
  debounceProgressMs: 2000,

  //wait this long before process.exit()
  //need this because we need to wait for ISS messages to
  //get sent, and the best we can do is give them time to get
  //sent becuase there's no callback on them to indicate completion
  shutdownDrainMs: 5000,

  soda: {
    appToken: 'nope',
    username: 'nope',
    password: 'nope'
  },

  log: {
    level: 'info',
    name: 'geo-import'
  },

  amq: {
    inName: '/queue/GeoImports',
    outNames: ['/queue/eurybates.import-status-events', '/queue/eurybates.activity-log'],
    user: 'admin',
    pass: 'admin',
    reconnectAttempts: 100,
    reconnectDelayMs: 500,
    heartbeat: 20 * 1000
  }
};
