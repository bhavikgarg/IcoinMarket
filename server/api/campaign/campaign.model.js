/**
 * campaign model.
 * @module ci-server/campaign-model
 */
'use strict';

var mongoose = require('mongoose'),
//    random = require('mongoose-random'),
    Schema = mongoose.Schema;

/**
*	Campaign Schema:<br>
- quality: Number,    //The purpose of this field is to identify the area where the campaign is shown on the page. Different quality level have different positions on the page. But currently this field has no use and contains null<br>
- dtcredits: Number,    // difference between credits/dtcredits  ->  "credits" denotes how many coins are assigned for campaign ? "dtcredits" is a special type of credit. Default campaign view time is 10 seconds, but if dtcredits are assigned to campaign then its view time is increased by assigned dtcredits time.<br>
- campaigntype: String,    // possible values of campaigntype ?  ->  Possible values are "text" and "banner". But currently only "text" is in use<br>
- expirecredits: Number,    // what is it meaning ?     ->   This fields holds the number i.e. how many coins is beign used from assigned credit coins. Example a user create a new campaign and assign 50 coins (i.e. credit) to campaign and its priority is 10. When a CI user view this campaign "expirecredits" has value 10, when another CI user view this campaign "expirecredits" has value 20 (i.e. previous value + 10). Similarly when 5th CI user view this campaign "expirecredits" have value 50 and after that campaign is expired as all the assigned credits are vanished (i.e. credits - expirecredits = 0).<br>
*	@var {json} CampaignSchema
*/
var CampaignSchema = new Schema({
  name: String,
  description: String,
  viewurl: String,
  priority: String,
  quality: Number,
  credits: Number,
  dtcredits: Number,
  amount: Number,
  campaigntype: String,
  userid: String,
  active: Boolean,
  expirecredits: Number,
  createdat: {type: Date, default: Date.now},
  // categories: {type: Array, default: [-1]},
  imagepath: String
});

//CampaignSchema.plugin(random, { path: 'camprandom' });

// Validations
CampaignSchema
  .path('name')
  .validate(function(value, respond) {
    if(!validatePresenceOf(value)) return respond(false);
    return respond(true);
  }, 'Required Title');

CampaignSchema
  .path('name')
  .validate(function(value, respond) {
    if(!validatePresenceOf(value) && ((value.trim().length) > 100 || (value.trim().length) < 5)) return respond(false);
    return respond(true);
  }, 'Title Should be min 5 character and max 100 character long');

CampaignSchema
  .path('description')
  .validate(function(value, respond) {
    if(!validatePresenceOf(value)) return respond(false);
    return respond(true);
  }, 'Required Description');

CampaignSchema
  .path('description')
  .validate(function(value, respond) {
    if(!validatePresenceOf(value) && ((value.trim().length) > 255 || (value.trim().length) < 50)) return respond(false);
    return respond(true);
  }, 'Description Should be min 50 character and max 255 character long');

CampaignSchema
  .path('viewurl')
  .validate(function(value, respond) {
    if(validatePresenceOf(value) && !(/^(http|https)\:\/\//.test(value.trim()))) return respond(false);
    return respond(true);
  }, 'View URL must have HTTP or HTTPS');


var validatePresenceOf = function(value) {
  return value && value.trim().length;
};

module.exports = mongoose.model('Campaign', CampaignSchema);
