/**
 * Express configuration
 */

 'use strict';

 var express = require('express');
 var favicon = require('serve-favicon');
 var morgan = require('morgan');
 var compression = require('compression');
 var bodyParser = require('body-parser');
 var methodOverride = require('method-override');
 var cookieParser = require('cookie-parser');
 var errorHandler = require('errorhandler');
 var path = require('path');
 var config = require('./environment');
 var passport = require('passport');
 var session = require('express-session');
 var mongoStore = require('connect-mongo')(session);
 var mongoose = require('mongoose');
 var cors = require('cors');
 var device = require('express-device');

 module.exports = function(app) {
   var env = app.get('env');
   app.set('views', config.root + '/server/views');
   app.engine('html', require('ejs').renderFile);
   app.set('view engine', 'html');
   app.use(compression());
   app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
   app.use(bodyParser.json({limit: "50mb"}));
   app.use(methodOverride());
   app.use(cookieParser());
   app.use(device.capture());

   // Request validation filter / middleware to verify each
   // requests and if request is done by proxy user (i.e. user info view by admin)
   // and request is other than GET, specified roots then
   // stop request immediate
   app.use(function(req, res, next) {
     var reqUrl   = req.url,
         allowUrl = [
           '/api/pay/packs-info',
           '/api/utilities/pack-info',
           '/api/affiliates/default-affilate',
           '/api/withdrawals/admin-fee',
           '/api/users/cx-view-update'
         ];

     if(allowUrl.indexOf(reqUrl) < 0 && req.headers._xser && req.headers._xser != '' && req.method.toUpperCase() != 'GET') {
       console.log('proxy user end request...');
       res.end();
       return false;
     }
     next();
   });

   app.use(cors({credentials: true,
        origin: [
            'https://support.icoinmarket.com',
            'https://api.icoinmarket.com',
            'https://login.icoinmarket.com'
        ],
allowedHeaders: ["Accept", "Accept-Datetime", "Accept-Encoding", "Accept-Language", "Accept-Params", "Accept-Ranges", "Access-Control-Allow-Credentials", "Access-Control-Allow-Headers", "Access-Control-Allow-Methods", "Access-Control-Allow-Origin", "Access-Control-Max-Age", "Access-Control-Request-Headers", "Access-Control-Request-Method", "Age", "Allow", "Alternates", "Authentication-Info", "Authorization", "Cache-Control", "Compliance", "Connection", "Content-Base", "Content-Disposition", "Content-Encoding", "Content-ID", "Content-Language", "Content-Length", "Content-Location", "Content-MD5", "Content-Range", "Content-Script-Type", "Content-Security-Policy", "Content-Style-Type", "Content-Transfer-Encoding", "Content-Type", "Content-Version", "Cookie", "DELETE", "Date", "ETag", "Expect", "Expires", "From", "GET", "GetProfile", "HEAD", "Host", "IM", "If", "If-Match", "If-Modified-Since", "If-None-Match", "If-Range", "If-Unmodified-Since", "Keep-Alive", "OPTION", "OPTIONS", "Optional", "Origin", "Overwrite", "POST", "PUT", "Public", "Referer", "Refresh", "Set-Cookie", "Set-Cookie2", "URI", "User-Agent", "X-Powered-By", "X-Requested-With", "_xser"]}));

   // Persist sessions with mongoStore
   // We need to enable sessions for passport twitter because its an oauth 1.0 strategy
   app.use(session({
     secret: config.secrets.session,
     resave: false,
     saveUninitialized: false,
     store: new mongoStore({
       mongooseConnection: mongoose.connection,
       db: 'Adscash',
       ttl: 86400           // 24 hours expiry time
     })
   }));
   app.use(passport.initialize());

   if ('production' === env) {
     app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
     app.use(express.static(path.join(config.root, 'public')));
     app.set('appPath', path.join(config.root, 'public'));
     app.use(morgan('dev'));
   }

   if ('development' === env || 'test' === env) {
    //  app.use(require('connect-livereload')());
//     app.use(express.static(path.join(config.root, '.tmp')));
     app.use(express.static(path.join(config.root, 'client')));
     app.set('appPath', path.join(config.root, 'client'));
     app.use(morgan('dev'));
     app.use(errorHandler()); // Error handler - has to be last
   }
};
