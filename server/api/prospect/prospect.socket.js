/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Prospect = require('./prospect.model');

exports.register = function(socket) {
  Prospect.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Prospect.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('prospect:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('prospect:remove', doc);
}