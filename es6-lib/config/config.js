export
default {
  port: 4445,

  //gate at which the service will not read the whole file to generate
  //a detailed summary. for files over this limit, an abbreviated summary
  //will be returned, which is much faster, but less helpful
  abbreviateSummarySize: 500 * 1000, //500kb

  //when the merger writes to layers, the layer will spill rows to the .ldjson
  //scratch file after this amount. note that this is per layer!
  //so if we have 100 layers,
  //and spillRowsToDiskAfter is 500, then we are keeping 100*500 rows
  //in memory.
  spillRowsToDiskAfter: 20,

  socketTimeoutMs: 60 * 1000,

  //number of rows to buffer in object mode feature streams
  rowBufferSize: 2,

  //maximum number of points to allow through the importer per row
  maxVerticesPerRow: 1000000,

  metrics: {
    heapMonitorInterval: 500,
  },
  heapDumpOut: '.',

  //don't send more than 1 ISS progress event within this time window
  debounceProgressMs: 2000,

  //wait this long before process.exit()
  //need this because we need to wait for ISS messages to
  //get sent, and the best we can do is give them time to get
  //sent becuase there's no callback on them to indicate completion
  shutdownDrainMs: 5000,

  log: {
    level: 'info',
    name: 'geo-import'
  },

  amq: {
    inName: '/queue/GeoImports',
    outName: '/queue/eurybates.import-status-events',
    user: 'admin',
    pass: 'admin'
  }
};