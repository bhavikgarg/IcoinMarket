'use strict';

var Configuration = require('./configuration.model');

// Get list of Upload media
exports.getConfig = function(req, res, next) {
    Configuration.findOne({key: req.query.key}).exec(function(err, data) {
        if (err) { return next(res, err);}
        if (!data) {
            res.status(200).json({ message: 'No config found for the above data'});
        } else {
            return res.status(200).json(data);
        }
    });
};

// Creates a new uploadmedia in the DB.
exports.updateConfig = function(req, res, next) {
    Configuration.findOne({key: req.body.key}, function (err, config) {
        if (err) { return next(res, err);}
        if(!config) {
            var config = new Configuration({
                key: req.body.key,
                value: req.body.value
            });
        } else {
             config.value = req.body.value;
             config.markModified('value');
        }
         config.save(function(err) {
             if(err) {return next(err);}
             return res.status(201).json({message: 'updated'});
         });
    });
};