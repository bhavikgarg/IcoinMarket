/**
 * RevenueCutof model.
This collection is designed for task "./tasks/silver-commission.js" but as the task is "Not In Use", this collection is also <b>"Not In Use"<b>
 * @module ci-server/revenuecutof-model
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var SilverCoinCommissionSchema = new Schema({
  lastpurchaseid: String,
  lastdate: { type: Date },
  status: String,
});

module.exports = mongoose.model('SilverCommissionTask', SilverCoinCommissionSchema);
