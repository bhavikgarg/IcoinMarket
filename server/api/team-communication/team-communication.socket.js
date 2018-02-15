/**
 * Broadcast updates to client when the model changes
 */

// 'use strict';
//
// var TeamCommunication = require('./team-communication.model');
//
// exports.register = function(socket) {
//   TeamCommunication.schema.post('save', function (doc) {
//     onSave(socket, doc);
//   });
//   TeamCommunication.schema.post('remove', function (doc) {
//     onRemove(socket, doc);
//   });
// }
//
// function onSave(socket, doc, cb) {
//   socket.emit('team-communication:save', doc);
// }
//
// function onRemove(socket, doc, cb) {
//   socket.emit('team-communication:remove', doc);
// }
