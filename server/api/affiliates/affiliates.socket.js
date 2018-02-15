/**
 * Broadcast updates to client when the model changes
 */
//
// 'use strict';
//
// var Affiliates = require('./affiliates.model');
//
// exports.register = function(socket) {
//   Affiliates.schema.post('save', function (doc) {
//     onSave(socket, doc);
//   });
//   Affiliates.schema.post('remove', function (doc) {
//     onRemove(socket, doc);
//   });
// }
//
// function onSave(socket, doc, cb) {
//   socket.emit('affiliates:save', doc);
// }
//
// function onRemove(socket, doc, cb) {
//   socket.emit('affiliates:remove', doc);
// }
