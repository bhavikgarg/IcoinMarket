var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var config = require('../../config/environment');
var Credits = require('../../api/credits/credits.model.js');
var CreditService = require('../../components/credits/credits.service');
var LatestSignup = require('../../api/utilities/latestsignups.model');

/**
 * Private function to register user and also linked it
 * with their sponsor
 *
 * @params {object} req         Request Object
 * @params {object} User        User Modal Object
 * @params {object} Genealogy   Genealogy Modal Object
 * @params {object} data        User information Object
 * @params {Function} callback  Callback function
 */
var registerUser = function registerUser(req, User, Genealogy, Sessions, data, callback) {

  Sessions.findById(req.cookies.refby, function(err, sessInfo) {
    if(!sessInfo || err) { return callback(err, null); }

    var _data = JSON.parse(sessInfo.session);

    User.findOne({username: _data.sponsorId+''}, function(error, sponsor) {
      if(error || !sponsor) {
        console.log('[err] Init Error: ', error, sponsor);
        return callback(error, null);
      }

      data.sponsor  = sponsor._id+'';
      data.verified = true;
      var user = new User(data);
      user.save(function(err) {
        console.log('[err] Save Error: ', err);
        if (err) return callback(err, null);

        /* add document to user credits */
      Credits.create({userid : user._id, adscash: 0, usd : 0}, function(err, ucredit){
            if(!err && ucredit){
              console.log("User credits created."+ucredit);
              console.log(config.signupBonus);
              if(config.signupBonus && config.signupBonus.usd)
              {
                var _Credits = new CreditService();
                _Credits.addCreditTransferLog(user._id, {
                  amount: config.signupBonus.usd,
                  description: config.signupBonus.description,
                  type: 'usd',
                  subtype: 'P',
                  cointype: 'PROMOTION-SIGNUP',
                  createdat: (new Date())
                }, function(err, data) {
                  console.log('Credit Log Info: ', err, data._id);
                  _Credits.updateCredits(user._id, {
                    adscash: 0,
                    usd : config.signupBonus.usd,
                    adcpacks : 0
                  }, function(err, _data) {
                    console.log('Credits Info signup bonus added: ', err, _data);
                  });
                });
              }
            }
        });

        Genealogy.create({
          'user': user,
          'ref': [
            sponsor._id+'',
            _data.sponsorName,
            sponsor.userProfileId,
            (_data.sponsorTarget ? _data.sponsorTarget : ''),
            _data.sponsorId
          ]
        }, function(gerror, ginfo) {

          if(gerror || !ginfo) {
            console.log('[err] Genealogy Save Error: ', gerror, ginfo);
            user.remove(function(e) { console.log('unable to create genealogy'); });
            return callback(gerror, null);
          }

          LatestSignup.create({userid : user._id, name : user.name, country : user.countryCode }, function(err, ltsp){
            console.log('Latest Signup added:'+err);
          });

          return callback(err, user);
        });
      });
    });
  });
}

exports.setup = function (User, config, Genealogy, Sessions) {
  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
      passReqToCallback: true
    },
    function(request, accessToken, refreshToken, profile, done) {

      var query = {'google.id': profile.id};
      if(profile.emails && profile.emails[0]) {
        query = {"$or": [{'google.id': profile.id}, {email: profile.emails[0].value}]};
      }

      User.findOne(query, function(err, user) {
        if (!user) {
          registerUser(request, User, Genealogy, Sessions, {
            name: profile.displayName,
            email: (profile.emails ? profile.emails[0].value : profile.username + '-emailnotfound@adscash.com'),
            role: 'user',
            username: profile.username,
            provider: 'google',
            google: profile._json
          }, function(error, _user) {
            console.log(error);
            if(error) return done(error);
            return done(error, _user);
          });
        }
        else {
          console.log('[info] >>> ', (profile.emails && profile.emails[0]));
          if(profile.emails && profile.emails[0]) {
            User.findOne({ email: profile.emails[0].value}, function(err, user){
              if (!user) {
                registerUser(request, User, Genealogy, Sessions, {
                  name: profile.displayName,
                  email: (profile.emails ? profile.emails[0].value : profile.username + '-emailnotfound@adscash.com'),
                  role: 'user',
                  username: profile.username,
                  provider: 'google',
                  google: profile._json
                }, function(error, _user) {
                  if(error) return done(error);
                  return done(error, _user);
                });
              }
              else {
                return done(err, user);
              }
            });
          }
          else {
            return done(err, user);
          }
        }
      });
    }
  ));
};
