/**
 * Broadcast updates to client when the model changes
 */

// 'use strict';
//
// var Withdrawal = require('./withdrawal.model');
//
// exports.register = function(socket) {
//   Withdrawal.schema.post('save', function (doc) {
//     onSave(socket, doc);
//   });
//   Withdrawal.schema.post('remove', function (doc) {
//     onRemove(socket, doc);
//   });
// }
//
// function onSave(socket, doc, cb) {
//   socket.emit('withdrawal:save', doc);
// }
//
// function onRemove(socket, doc, cb) {
//   socket.emit('withdrawal:remove', doc);
// }
