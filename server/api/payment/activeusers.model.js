/**
 * ActiveUsers model.
 * @module ci-server/activeusers-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

/**
ActiveUsers schema<br>
- createdat: { type: Date } (Revenue Share Cycle Start Time)<br>
- expireat: { type: Date } (List valid upto, (i.e. 30 minue), Example if cycle run at "2016-06-12T12:30:00.000Z" then its value is "2016-06-12T13:00:00.000Z")<br>
- userslist: Object (User's Id array, (i.e. User's who are active between "createdat" and "expireat" period))<br>
@var
*/
var ActiveUsers = new Schema({
  createdat: { type: Date },
  expireat: { type: Date },
  userslist: Object
});

module.exports = mongoose.model('ActiveUser', ActiveUsers);
