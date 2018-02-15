/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/dailyads', require('./api/dailyads'));
  app.use('/api/soloemails', require('./api/soloemails'));
  app.use('/api/withdrawals', require('./api/withdrawal'));
  app.use('/api/tasks', require('./api/task'));
  app.use('/api/soloadds', require('./api/soloadds'));
  app.use('/api/team-communications', require('./api/team-communication'));
  app.use('/api/affiliates', require('./api/affiliates'));
  app.use('/api/campaigns', require('./api/campaign'));
  app.use('/api/pay', require('./api/payment'));
  app.use('/api/products', require('./api/products'));
  app.use('/api/genealogys', require('./api/genealogy'));
  app.use('/api/utilities', require('./api/utilities'));
  app.use('/api/prospects', require('./api/prospect'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/kyc', require('./api/usermeta'));
  app.use('/api/uploadmedia', require('./api/uploadmedia'));
  app.use('/api/cryptomarketdata', require('./api/cryptomarketdata'));
  app.use('/api/configuration/', require('./api/configuration'));
  app.use('/api/commitments/', require('./api/commitments'));

  app.use('/auth', require('./auth'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};
