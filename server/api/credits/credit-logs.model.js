/**
 * creditLogs model.
 * @module ci-server/creditLogs-model
 */
'use strict';

var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

/**
CreditLogsSchema<br>
- type: This field denotes which type of coin is credited or debited in user's account<br>
- subtype: This field contains either 'P' or 'E'. 'P' denotes purchased and 'E' denotes Expense<br>
- cointype: This field denotes which type of coin is used to get the desired coins. (for example. if user purchase a gold or silver coin its values is gold and if user purchase a text ads its value is silver)<br>
- description field:<br>
User purchase Gold Packs, In this case description field have value: "Purchase Gold Pack"<br>
User purchase Silver Packs, In this case description field have value: "Purchase Silver Pack"<br>
User get commission (Gold Pack Product i.e. Business Opportunity Clicks), In this case description field have value:  "Team Sales Commission for "BUSINESS OPPORTUNITY CLICKS" (PURCHASE_MEMBER_USERNAME) (Distribution for Gen PURCHASE_MEMBER_LEVEL_FROM_COMMISSION_MEMBER)"<br>
User get commission (Silver Pack), In this case description field have value:  "Team Sales Commission for "SILVER PACKS" (PURCHASE_MEMBER_USERNAME) (Distribution for Gen PURCHASE_MEMBER_LEVEL_FROM_COMMISSION_MEMBER)"<br>
User get revenue share, In this case description field have value: "Revenue Share Coins"<br>
@var
*/
var CreditLogsSchema = new Schema({
  userid: String,
  coins: SchemaTypes.Double,
  usd:SchemaTypes.Double,
  description: String,
  createdat: {type: Date, default: Date.now},
  type: String,
  subtype: String,
  cointype: String,
  email: String,
  username: String,
  comment:String,
  active: {type: Boolean, default: true},
  modified: {type: Boolean, default: false}
});

module.exports = mongoose.model('UserCreditLogs', CreditLogsSchema);
