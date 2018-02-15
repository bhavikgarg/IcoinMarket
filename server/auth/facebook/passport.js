var FacebookStrategy = require('passport-facebook').Strategy;
var passport = require('passport');

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
  var _data = {};
  Sessions.findById(req.cookies.refby, function(err, sessInfo) {
    if(err) {
      return callback(err, null);
    }
    if(!sessInfo) {
      _data.sponsorId = config.sponsorUn;
    } else {
      _data = JSON.parse(sessInfo.session);
    }

    User.findOne({username: _data.sponsorId+''}, function(error, sponsor) {
      if(error || !sponsor) {
        console.log('[err] Init Error: ', error, sponsor);
        return callback(error, null);
      }

      data.sponsor  = sponsor._id+'';
      data.verified = false;
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
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL,
      passReqToCallback: true
    },
    function(req, accessToken, refreshToken, profile, done) {
      User.findOne({
        'facebook.id': profile.id
      },
      function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          var modUn = profile.displayName.toLowerCase().split(" ");
          var username = modUn[1] + "_" + modUn[0] + profile.id.substr(5, 3);
          registerUser(req, User, Genealogy, Sessions, {
            name: profile.displayName,
            email: (profile.emails ? profile.emails[0].value : ''),
            role: 'user',
            username: ( profile.username ? profile.username : username),
            provider: 'facebook',
            facebook: profile._json
          }, function(error, _user) {
            if(error) return done(error);
            return done(error, _user);
          });
        } else {
          return done(err, user);
        }
      })
    }
  ));
};
