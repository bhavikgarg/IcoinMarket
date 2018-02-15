'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ConfigSchema = new Schema({
    key: String,
    value: Schema.Types.Mixed,
    active: {type: Boolean,'default': true},
    createdat: {type: Date,'default': Date.now},
    lastupdatedat: {type: Date,'default': Date.now}
});

/**
 * Pre-save hook
 */
ConfigSchema.pre('save', function(next) {
    this.lastupdatedat = new Date();
    return next();
});

module.exports = mongoose.model('Config', ConfigSchema);