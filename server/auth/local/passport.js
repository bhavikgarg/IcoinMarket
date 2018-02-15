var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('../crypto.helper');

exports.setup = function (User, config) {
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password' // this is the virtual field on the model
    },
    function(email, password, done) {
      User.findOne({
        // email: crypto.decrypt(email).toLowerCase()
        email: email.toLowerCase()
      }, function(err, user) {
        if (err) return done(err);

        if (!user) {
          return done(null, false, { message: 'This email is not registered.' });
        }
        if (!user.authenticate(crypto.decrypt(password))) {
          return done(null, false, { message: 'This password is not correct.' });
        }
        if (!user.verified) {
          return done(null, false, { message: 'User is not verified user. Please check your email for verification instruction.' });
        }
        if(user.isBlocked) {
          return done(null, false, { message: 'Your account is blocked by ICoin Market. Please contact support team for more details or email us at care@adscash.us .' });
        }
        return done(null, user);
      });
    }
  ));
};