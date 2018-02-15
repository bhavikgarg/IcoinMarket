'use strict';

var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var autoInc   = require('mongoose-sequence');
var crypto    = require('crypto');
var authTypes = ['github', 'twitter', 'facebook', 'google'];

var UserSchema = new Schema({
  name: String,
  email: { type: String, lowercase: true },
  role: {
    type: String,
    default: 'user'
  },
  hashedPassword: String,
  provider: String,
  salt: String,
  facebook: {},
  twitter: {},
  google: {},
  github: {},
  ip: String,
  countryName: String,
  countryCode: String,
  verified: Boolean,
  paidUser: Boolean,
  mobile: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  accountname: String,
  accountno: String,
  bankname: String,
  branch: String,
  code: String,
  avatar: String,
  userProfileId: Number,
  // categories: {type: Array, default: [-1]},
  sponsor: String,
  createdat: { type: Date, "default": Date.now },
  username: { type: String, lowercase: true },
  govidtaxid: String,
  personaldoc: String,
  quickypay: String,
  advcash: String,
  advcashedit: { type: Boolean, 'default': true },
  payza: String,
  payzaedit: { type: Boolean, 'default': true },
  paypal: String,
  bitcoin: String,
  bitcoinscreenshot: String,
  bitcoinedit: { type: Boolean, 'default': true },
  photoid: String,
  isBlocked: { type: Boolean, "default": false },
  activeclick: Date,
  currentcxview: String,
  confirmSponsor: { type: Boolean, "default": false },
  agentinfo: String,
  expiryTime: { type: Date },
  stp: String,
  stpedit: { type: Boolean, 'default': true },
  username1: String,
  commission : Number,
  totalInvestment : Number,
  totalReturn : Number,
  maximumEarningSource : String,
  totalCommission : Number,
  secondaryMobile: String,
  timeZone : String,
  timeZoneCountry: String,
  preferredContactTimeStart:{type: Number},
  preferredContactTimeEnd:{type: Number},
  /*contactTimeStart: {type: Number, default: 0},
  contactTimeEnd: {type: Number, default: 0},*/
  skypeName : String,
  callStatus: String,
  userOffset : {type: Number},
  assignedUser:String,
  statusLastUpdatedAt :Date,
  isSupportAdminManager: {type:Boolean, 'default':false}
});

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      'name': this.name,
      'role': this.role
    };
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function() {
    return {
      '_id': this._id,
      'role': this.role
    };
  });

/**
 * Validations
 */

// Validate empty name
UserSchema
  .path('name')
  .validate(function(value, respond) {
    if(!validatePresenceOf(value)) return respond(false);
    return respond(true);
  }, 'Required user\'s name');

// Validate empty mobile
UserSchema
  .path('mobile')
  .validate(function(value, respond) {
    if(!validatePresenceOf(value)) return respond(false);
    if(!validateMobilePattern(value)) return respond(false);

    return respond(true);
  }, 'Mobile number required or have invalid value');

// Validate empty email
UserSchema
  .path('email')
  .validate(function(email) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return email.length;
  }, 'Email cannot be blank');

// Validate empty password
UserSchema
  .path('hashedPassword')
  .validate(function(hashedPassword) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return hashedPassword.length;
  }, 'Password cannot be blank');

// Validate email is not taken

// This is removed as sparse index on email is created on mongodb

// UserSchema
//   .path('email')
//   .validate(function(value, respond) {
//     var self = this;
//     this.constructor.findOne({email: value}, function(err, user) {
//       if(err) throw err;
//       if(user) {
//         if(self.id === user.id) return respond(true);
//         return respond(false);
//       }
//       respond(true);
//     });
// }, 'The specified email address is already in use.');

// Validate username is not taken
UserSchema
  .path('username')
  .validate(function(value, respond) {
    var self   = this;
    var _value = (value && value.trim().length ? value.trim() : '');

    if(!validatePresenceOf(value)) return respond(false);
    if(!validateUsername(_value)) return respond(false);

    this.constructor.findOne({username: _value}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified username is invalid or already in use.');

var validatePresenceOf = function(value) {
  return value && value.trim().length;
};

var validateUsername = function(value) {
  return ((/^[A-Za-z0-9\_\@\.\-\u00C0-\u1FFF\u2C00-\uD7FF]*$/.test(value)) && value.length >= 6 && value.length <= 19);
};

var validateMobilePattern = function(value) {
  var _value = validatePresenceOf(value) ? value.trim() : '';
      _value = _value.split('-');
  return (_value.length == 2 && /^(\+|\-)(\d\s{0,1})(\d{0,4})$/.test(_value[0]) && /^\d{5,10}$/.test(_value[1]));
}

/**
 * Pre-save hook
 */
UserSchema
  .pre('save', function(next) {
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else
      next();
  });

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha1').toString('base64');
  }
};

UserSchema.plugin(autoInc, {id: 'userPId_inc', inc_field: 'userProfileId'});
module.exports = mongoose.model('User', UserSchema);
