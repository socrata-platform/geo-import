import _ from 'underscore';
/**
 * This awful thing encapsulates some of the awfulness coming from core,
 * in which it nests escaped json structures in a JSON message, up to three levels
 * deep, so we can call JSON.parse (at least) three times instead of just once!
 *
 * also, cool how the auth info is stored under a key called 'file-type'
 */
function parseAMQMessage(message) {
  message = JSON.parse(message);

  var fileTypeAuthThing = _.isString(message['file-type']) ? JSON.parse(message['file-type']) : message['file-type'];
  fileTypeAuthThing.auth = _.isString(fileTypeAuthThing.auth) ? JSON.parse(fileTypeAuthThing.auth) : fileTypeAuthThing.auth;

  return _.extend({}, message, {
    'file-type': fileTypeAuthThing,
    script: _.isString(message.script) ? JSON.parse(message.script) : message.script,
    blobId: _.last(message.source.split(':'))
  });
}

export {
  parseAMQMessage
};