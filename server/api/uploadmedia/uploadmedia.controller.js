'use strict';

var uploadmedia = require('./uploadmedia.model');

// Get list of Upload media
exports.getsaveMedia = function(req, res) {
    var query = {
        mediauploadfor: req.query.mediauploadfor
    };

    if (req.user.role == 'user') {
        query.active = true;
    }
    uploadmedia.find(query).exec(function(err, data) {
        if (err) {
            return handleError(res, err);
        }
        uploadmedia.count(query, function(err, rows) {
            return res.status(200).json({
                data: data,
                rows: rows
            });
        });
    });
};

// // Get a single Upload media
// exports.show = function(req, res) {
//   uploadmedia.findById(req.params.id, function (err, uploadmedia) {
//     if(err) { return handleError(res, err); }
//     if(!uploadmedia) { return res.status(404).send('Not Found'); }
//     return res.json(uploadmedia);
//   });
// };

// Creates a new uploadmedia in the DB.
exports.savemedia = function(req, res) {    
    uploadmedia.create(req.body, function(err, uploadmedia) {
        if (err) {
            return handleError(res, err);
        }
        return res.status(201).json(uploadmedia);
    });
};

// // Updates an existing uploadmedia in the DB.
// exports.update = function(req, res) {
//   if(req.body._id) { delete req.body._id; }
//   uploadmedia.findById(req.params.id, function (err, uploadmedia) {
//     if (err) { return handleError(res, err); }
//     if(!uploadmedia) { return res.status(404).send('Not Found'); }
//     var updated = _.merge(uploadmedia, req.body);
//     updated.save(function (err) {
//       if (err) { return handleError(res, err); }
//       return res.status(200).json(uploadmedia);
//     });
//   });
// };

// Deletes a uploadmedia from the DB.
exports.deletemedia = function(req, res) {
    uploadmedia.findById(req.body.id, function(err, uploadmedia) {
        if (err) {
            return handleError(res, err);
        }
        if (!uploadmedia) {
            return res.status(404).send('Not Found');
        }
        uploadmedia.update({
            active: req.body.active
        }, function(err) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(204).send('No Content');
        });
    });
};



/**
 *  Find and delete existing media and then insert media in the DB in sequence.
 * @function
 * @access media
 * @param {json} body - updated media fields
 * @return {json} updated doc
 */
exports.updateMediaSequence = function(req, res) {
    var medias = req.body;
    if (medias && medias.length > 0) {
        try {
            //remove all
            uploadmedia.remove({
                '_id': {
                    '$in': medias
                }
            }, function(err, response) {
                if (err) {
                    return handleError(res, err);
                }
            });

            //add all
            var mediaItems = [];
            medias.forEach(function(item) {
                var mediaData = {
                    title: item.title,
                    mediatype: item.mediatype,
                    mediauploadfor: item.mediauploadfor,
                    fileurl: item.fileurl,
                    videotitle: item.videotitle,
                    videotitlelinkurl: item.videotitlelinkurl,
                    defaultLink: item.defaultLink,
                    landingPageDesc : item.landingPageDesc,
                    active: item.active,
                    createdat: item.createdat || Date.now
                };
                var newMedia = new uploadmedia(mediaData);
                mediaItems.push(newMedia);
            }, this);

            uploadmedia.insertMany(mediaItems, {
                ordered: true
            });
        } catch (e) {
            return res.status(500).send("Server error: " + e);
        }
        return res.status(200).send("Media sequence has been updated successfully.");
    } else {
        return res.status(200).json({
            error: true,
            message: "Please provide data to update."
        });
    }
};