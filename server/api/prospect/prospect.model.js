'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProspectSchema = new Schema({
  userid: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  mobile: { type: String, required: true },
  active: { type: Boolean, "default": true },
  status: { type: String, required: true, "default": "cold" } // Hold values 'hot', 'cold'
}, {timestamps: true});


// Validations
ProspectSchema
  .path('name')
  .validate(function(value, respond) {
    if(!validateUsername(value)) return respond(false);
    return respond(true);
  }, 'Required prospect\'s name');

ProspectSchema
  .path('mobile')
  .validate(function(value, respond) {
    if(!validateMobilePattern(value)) return respond(false);
    return respond(true);
  }, 'Mobile number required or have invalid value');


ProspectSchema
  .path('status')
  .validate(function(value, respond) {
    if(!validateStatusValue(value)) return respond(false);
    return respond(true);
  }, 'Prospect status could be either "hot" or "cold"');


var validatePresenceOf = function(value) {
  return value && value.trim().length;
};

var validateMobilePattern = function(value) {
  var _value = validatePresenceOf(value) ? value.trim() : '';
      _value = _value.split('-');
  return (_value.length == 2 && /^(\+|\-)(\d\s{0,1})(\d{0,4})$/.test(_value[0]) && /^\d{5,10}$/.test(_value[1]));
}

var validateUsername = function(value) {
  return ((/^[A-Za-z0-9\s\_\@\.\-\u00C0-\u1FFF\u2C00-\uD7FF]*$/.test(value)) && value.length >= 6 && value.length <= 25);
};

var validateStatusValue = function(value) {
  var validValues = ['hot', 'cold'];
  return (value && value.trim().length) && (validValues.indexOf(value) >= 0);
};

module.exports = mongoose.model('Prospect', ProspectSchema);
