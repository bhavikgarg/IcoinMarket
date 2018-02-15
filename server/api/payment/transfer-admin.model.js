/**
 * TransferAdmin model.
 * @module ci-server/transferadmin-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

/**
TransferAdminSchema
- fuserid: String (User's "_id" from "users" collection, User who want to transfer their gold coins to other CI user)<br>
- fusername: String, (User's "username" from "users" collection, who want to transfer their gold coins to other CI user)<br>
- fuserfullname: String (User's "name" from "users" collection, who want to transfer their gold coins to other CI user)<br>
- femail: String (User's "email" from "users" collection, who want to transfer their gold coins to other CI user)<br>
- tuserid: String (User's "_id" from "users" collection, User who received the transferred gold coins)<br>
- tusername: String (User's "username" from "users" collection, User who received the transferred gold coins)<br>
- tuserfullname: String (User's "name" from "users" collection, User who received the transferred gold coins)<br>
- tuseremail: String (User's "email" from "users" collection, User who received the transferred gold coins)<br>
- coins: Number (Transferred number of coins)<br>
- createdat: { type: Date, "default": Date.now } (When coins are transferred)<br>
*/
var TransferAdminSchema = new Schema({
  fuserid: String,
  fusername: String,
  fuserfullname: String,
  femail: String,
  tuserid: String,
  tusername: String,
  tuserfullname: String,
  tuseremail: String,
  coins: Number,
  createdat: { type: Date, "default": Date.now }
});

module.exports = mongoose.model('TransferAdmin', TransferAdminSchema);
