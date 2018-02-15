'use strict';

var config = require('../../config/environment');
var Usermeta = require('./usermeta.model');
var MetaRejection = require('./usermeta-rejection-logs.model');
var User = require('../../api/user/user.model');
var uuid = require('uuid');
var _ = require('lodash');
var Promise = require('promise');

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
AWS.config.update({accessKeyId: config.aws.accessKeyId, secretAccessKey: config.aws.secretAccessKey});
//@TODO add constructor for Kyc Component

var KycComponents = {

    /**
     * Finds a user based on user id from the Users Collection, if found returns the User Collection
     * @param userId
     * @returns {json} {error: true/false, ,message: "....", data: "....."}
     */
    findUserById : function ( userId ) {
        var res = {
            error: "",
            message: ""
        };
        return new Promise(function (resolve, reject) {
            // Is User not admin or finance or agent or solo
            User.findById(userId, function (err, user) {
                if (err) {
                    res.error = true;
                    res.message = err;
                    console.log( err );
                    reject(res);
                }
                if (user) {
                    res.error = false;
                    res.message = "User found";
                    res.result = user;
                    resolve(res);
                } else {
                    res.error = false;
                    res.message = "User record not found";
                    reject(res);
                }
            });
        });
    },


    /**
     * Finds a usermeta based on user id from the Usermeta Collection, if found returns the UserMeta Collection
     * @param userId
     * @returns {json} {error: true/false, ,message: "....", data: "....."}
     */
    findUserMetaById : function ( userId ) {
        var res = {
            error: "",
            message: ""
        };
        return new Promise( function (resolve, reject) {
            Usermeta.findOne( { 'user.id' : userId }, function (err, userMeta) {
                if (err) {
                    res.error = true;
                    res.message = err;
                    console.log( err );
                    return reject(res);
                }
                if ( userMeta == null ) {
                    res.error = true;
                    res.message = "No record Found";
                    return reject(res);
                } else {
                    res.error = false;
                    res.message = "Usermeta found";
                    res.result = userMeta;
                    return resolve(res);
                }
            });
        });
    },

    /**
     * Finds a user based on user id from the Users Collection, and if found saves it to usermeta collection and returns its record
     * @param userId
     * @param cb callback
     * @returns {json} {error: true/false, ,message: "....", data: "....."}
     */
    saveNewUserKyc : function( userId , cb) {
        var res = {
            error: "",
            message: ""
        };
        User.findById(userId, function (err, user) {
            if (err) {
                res.error = true;
                res.message = err;
                console.log( err );
                return cb(res);
            }
            if (user) {
                res.error = false;
                res.message = "User found";
                res.result = user;
                var userMetaObj = new Usermeta({ //Add new user meta
                    user : {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        mobile: user.mobile
                    }
                });
                userMetaObj.save( function (err, userMeta) {
                    if ( err ) {
                        res.error = true;
                        res.message = err;
                        console.log( err );
                        return cb(res);
                    }
                    if ( userMeta ) {
                        res.error = false;
                        res.message = "New Usermeta record added";
                        res.result = userMeta;
                        return cb(res);
                    }
                });
            } else {
                res.error = false;
                res.message = "User record not found";
                return cb(res);
            }
        });
    },


    /**
     * Checks if the entered govId is valid for not
     * @param govId
     * @returns {boolean}
     */
    isUserKycGovIdValid: function( govId ) {
        var alNumRegex = /^[a-z0-9]+$/igm;
        if( alNumRegex.test( govId ) ) {
            if ( govId.length <=26 && govId.length >= 5 ) {
                return true;
            } else {
                return false;
            }
        } else{
            return false;
        }
    },

    /**
     * Checks if the entered taxId is valid for not
     * @param taxId
     * @returns {boolean}
     */
    isUserKycTaxIdValid: function( taxId ) {
        var alNumRegex = /^[a-z0-9]+$/igm;
        if( alNumRegex.test( taxId ) ) {
            if ( taxId.length <=20 && taxId.length >= 5) {
                return true;
            } else {
                return false;
            }
        } else{
            return false;
        }
    },


    changeUserKycStatus: function( userId, body, status ) {
        var res = {
            error: "",
            message: ""
        };
        var _self = this;
        return new Promise( function(resolve, reject){
          var data = {'kyc_flag': status};

          if(body && body.doctype) {
            for(var idx in body.doctype) {
              if(!data.hasOwnProperty('doctypes')) data['doctypes'] = {};
              data['doctypes'][idx] = body.doctype[idx];
            }
          }

          console.log('Post Data KYC >> ', data);

            Usermeta.findOneAndUpdate({'user.id': userId}, data, function (err, userMeta) {
                if (err) {
                    res.error = true;
                    res.message = err;
                    console.log( err );
                    reject(res);
                }
                if ( userMeta == null  ) {
                    res.error = true;
                    res.message = "User Kyc record not found";
                    reject(res);
                } else {
                    console.log(userMeta);
                    res.error = false;
                    res.message = "Status changed to " + status;
                    resolve(res);
                }
            });
        });
    },


    /**
     * Updates the user meta (KYc Gov Id) with the new KYC details
     * @param userId
     * @param govId
     * @returns {*}
     */
    updateUserGovId : function( userId, govId ) {
        var res = {
            error: "",
            message: ""
        };
        var _self = this;
        return new Promise( function(resolve, reject){
            if (_self.isUserKycGovIdValid( govId )) {
                Usermeta.findOneAndUpdate({'user.id': userId}, {$set: {'user.govid': (govId).toUpperCase()}}, {new: true}, function (err, userMeta) {
                    if (err) {
                        res.error = true;
                        res.message = err;
                        console.log( err );
                        reject(res);
                    }
                    if ( userMeta ) {
                        res.error = false;
                        res.message = "User Government Id Updated";
                        resolve(res);
                    } else {
                        res.error = true;
                        res.message = "User Government record cannot be updated";
                        console.log( err );
                        reject(res);
                    }
                });
            } else {
                res.error = true;
                res.message = "Invalid Government Id";
                reject(res);
            }
        });
    },


    /**
     * Updates the user meta (KYC Tax Id) with the new KYC details
     * @param userId
     * @param taxId
     * @returns {*}
     */
    updateUserTaxId : function( userId, taxId ) {
        var res = {
            error: "",
            message: ""
        };
        var _self = this;
        return new Promise( function(resolve, reject){
            if (_self.isUserKycTaxIdValid( taxId )) {
                Usermeta.findOneAndUpdate({'user.id': userId}, {$set: {'user.taxid': (taxId).toUpperCase()}}, {new: true}, function (err, userMeta) {
                    if (err) {
                        res.error = true;
                        res.message = err;
                        console.log( err );
                        reject(res);
                    }
                    if ( userMeta ) {
                        res.error = false;
                        res.message = "User Tax Id Updated";
                        resolve(res);
                    } else{
                        res.error = true;
                        res.message = "User Tax Record not updated";
                        console.log( err );
                        reject(res);
                    }
                });
            } else {
                res.error = true;
                res.message = "Invalid Tax Id";
                reject(res);
            }
        });
    },

    /**
     * Checks if the user with given role is allowed to upload or not
     * "user" roles are allowed to upload
     * @param userId
     * @return {boolean}
     */
    isUserRoleAllowedToUpload: function (userId) {
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };
            // Is User not admin or finance or agent or solo
            User.findById(userId, function (err, user) {
                if (err) {
                    console.log( err );
                    reject(err);
                }
                if (user) {
                    if (_.includes(["user"], user.role)) {
                        resolve(true);
                    } else {
                        res.error = true;
                        res.message = "User not allowed to upload KYC.";
                        reject(res);
                    }
                } else {
                    res.error = true;
                    res.message = "User not found.";
                    reject(res);
                }
            });
        });
    },



    /**
     * Checks if the user can edit his KYC
     * @param userId
     * @return {boolean}
     */
    canUserEditKyc: function (userId) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };
            _self.findUserMetaById( userId ).then( function( data ) {
                var flag = false;
                if ( data.result.kyc_flag == config.kycFlags.kycUnverifiedFlag.status ){
                    flag = true;
                } else if ( data.result.kyc_flag == config.kycFlags.kycRejectedFlag.status )  {
                    flag = true;
                }
                if ( flag ) {
                    res.error = false;
                    res.message = "User is allowed to update KYC.";
                    resolve(res);
                } else {
                    res.error = true;
                    res.message = "User is not allowed to update KYC.";
                    reject(res);
                }
            });
        });
    },



    /**
     * Checks if the user government id is unique
     * @param govId
     * @return {boolean}
     */
    isUserGovIdUnique: function (govId) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };

            if(!govId || (govId && govId.trim() == '')) {
              res.error = true;
              res.message = "Empty value, Cannot save !";
              reject(res);
            }
            else {
              Usermeta.findOne( { 'user.govid' : (govId).toUpperCase() }, function (err, userMeta) {
                  if (err) {
                      res.error = true;
                      res.message = err;
                      console.log( err );
                      reject(res);
                  }

                  if ( userMeta == null ) {
                      res.error = false;
                      res.message = "User Government Id is unique";
                      resolve(res);
                  } else {
                      res.error = true;
                      res.message = "Duplicate Government Id, cannot save !";
                      reject(res);
                  }
              });
            }
        });
    },


    /**
     * Checks if the user government id is unique
     * @param taxId
     * @return {boolean}
     */
    isUserTaxIdUnique: function (taxId) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };

            if(!taxId || (taxId && taxId.trim() == '')) {
              res.error = true;
              res.message = "Empty value, Cannot save !";
              reject(res);
            }
            else {
              Usermeta.findOne( { 'user.taxid' : (taxId).toUpperCase() }, function (err, userMeta) {
                  if (err) {
                      res.error = true;
                      res.message = err;
                      console.log( err );
                      reject(res);
                  }
                  if ( userMeta == null ) {
                      res.error = false;
                      res.message = "User Tax Id is unique";
                      resolve(res);
                  } else {
                      res.error = true;
                      res.message = "Duplicate Tax Id. cannot save !";
                      reject(res);
                  }
              });
            }
        });
    },






    /**
     * Checks if the user file upload type is valid of not
     * @param type
     * @return {boolean}
     */
    isUserUploadTypeValid: function (type) {
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };
            if (_.includes(["selfie", "id_1", "id_2"], type)) {
                resolve(true);
            } else { //@TODO add more types
                res.error = true;
                res.message = "Invalid user file type.";
                reject(res);
            }
        });
    },


    /**
     * Checks if the user file upload type has extension which is allowed by the server
     * @param type
     * @return {boolean}
     */
    isValidFileExtension: function (type) {
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };
            if (_.includes(config.kycUploadFileTypes, type)) {
                console.log("Input TYpe correct");
                resolve(true);
            } else {
                res.error = true;
                res.message = "Invalid File Type";
                reject(res);
            }
        });
    },


    /**
     * Upload files to s3
     * @param req Request Object
     * @param fileName Unique File Name
     * @return {boolean}
     */
    uploadKycToS3: function (req, fileName) {
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };
            // Begin Uploading
            var dataString = req.body.imageData;
            var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            var response = {};

            if (matches.length !== 3) {
                res.error = true;
                res.message = 'Invalid input string';
                reject(res);
            } else {
                response.type = matches[1];
                response.data = new Buffer(matches[2], 'base64');
                response.ext = matches[1].split('/');
                var s3 = new AWS.S3({params: {Bucket: config.aws.bucket}});
                s3.upload({
                    Key: fileName,
                    Body: response.data,
                    ContentType: response.type,
                    ACL: "private"
                }, function (err, data) {
                    if (err) {
                        res.error = true;
                        res.message = 'Upload Error from s3' + err;
                        console.log(err);
                        reject(res);
                    }
                    if (data) {
                        var result = {"url": data.Location, "type": response.type, "fileName": fileName};
                        resolve(result);
                    } else {
                        res.error = true;
                        res.message = 'No response from S3';
                        reject(res);
                    }
                });
            }
        });
    },


    /**
     * Generates a 15minutes signed Url for fileName
     * @param fileName
     * @returns {*}
     */
    getSignedUrlForKyc: function (fileName) {
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };
            var s3 = new AWS.S3();
            var params = {Bucket: config.aws.bucket, Key: fileName};
            s3.getSignedUrl('getObject', params, function (err, url) {
                if (err) {
                    res.error = true;
                    res.message = "Cannot Get Authenticated URL to View";
                    console.log( err );
                    reject(err);
                }
                res.error = false;
                res.message = "Authenticated URL generated";
                res.result = {
                    url: url
                };
                console.log("Signed URL is ", url);
                resolve(res);
            });
        });
    },


    /**
     * Generates a 15minutes signed Url for fileName
     *
     * @auth user,admin
     * @route /get-signed-url
     * @controller getSignedKycUrl
     * @param fileName
     * @param cb
     */
    generateSignedUrl: function (fileName, cb) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };
            _self.getSignedUrlForKyc( fileName ).then(function (data) {
                return cb(data);
            }, function (err) {
                return cb(err);
            });
        });
    },



    /**
     * Checks whether user Meta record exists or not
     * @param userId UserId
     * @return {boolean}
     */
    isUserKycRecordExists: function (userId) {
        Usermeta.findOne({'user.id': userId}).exec(function (err, userMeta) {
            if (err) {
                return false;
            }
            else {
                return true;
            }
        });
    },


    /**
     * Checks whether user can update his KYC. Based on User Status : Unverified or Rejected
     * @param userId
     * @return {boolean}
     */
    canUserUploadKycRecord: function (userId) {
        var res = {
            error: "",
            message: ""
        };
        return new Promise( function( resolve, reject ){
            Usermeta.findOne({'user.id': userId}).exec(function (err, userMeta) {
                if (err) {
                    res.error = true;
                    res.message = err;
                    console.log( err );
                    reject(err);
                }
                if ( userMeta ) {
                    res.error = userMeta.canUserUpdateKyc;
                    res.message = "Permission is " +  userMeta.canUserUpdateKyc;
                    if (userMeta.canUserUpdateKyc) {
                        resolve( res );
                    } else{
                        reject(res );
                    }
                } else {
                    res.error = true;
                    res.message = "Record not found";
                    console.log( err );
                    reject(err);
                }
            });
        });

    },


    addKycUploadedDocumentToDB: function (fileName, type, userId, doctype) {
        return new Promise(function (resolve, reject) {
            var res = {
                error: "",
                message: ""
            };
            if (type == "selfie") {
                Usermeta.findOneAndUpdate({'user.id': userId}, {$set: {'s3asset.selfie': fileName}}, {new: true}, function (err, userMeta) {
                    if (err) {
                        res.error = true;
                        res.message = err;
                        console.log( err );
                        reject(res);
                    }
                    res.error = false;
                    res.message = "File Successfully Uploaded";
                    res.result = {url : fileName};
                    resolve(res);
                });
            }
            if (type == "id_1") {
                Usermeta.findOneAndUpdate({'user.id': userId}, {$set: {'s3asset.id_1': fileName, 'doctypes.id_1' : doctype }}, {new: true}, function (err, userMeta) {
                    if (err) {
                        res.error = true;
                        res.message = err;
                        console.log( err );
                        reject(res);
                    }
                    res.error = false;
                    res.message = "File Successfully Uploaded";
                    res.result = { url: fileName };
                    resolve(res);
                });
            }
        });
    },


    getSingleUserRecord: function (userId, cb) {
        var _self = this;
        var res={};
        _self.findUserMetaById( userId ).then(function(data) {
            var _rejectResone1 = ((data.result.moderator.rejectReason && data.result.moderator.rejectReason != '') ? data.result.moderator.rejectReason : '');
            var _rejectResone2 = ((data.result.admin.rejectReason && data.result.admin.rejectReason != '') ? data.result.admin.rejectReason : '');
            var _rejectResone = (_rejectResone1 != '' ? _rejectResone1 : (_rejectResone2 != '' ? _rejectResone2 : ''));

            res.error = false;
            res.message = "User Record found";
            res.result = {
              user: { govid: data.result.user.govid , taxid: data.result.user.taxid } ,
              kyc_flag : data.result.kyc_flag,
              s3asset: { selfie: data.result.s3asset.selfie , id_1: data.result.s3asset.id_1 },
              doctype: { selfie: data.result.doctypes.selfie, id_1: data.result.doctypes.id_1 },
              assetsStatus: { selfie: data.result.assetsStatus.selfie, id_1: data.result.assetsStatus.id_1 },
              rejectReason: _rejectResone
            };
            return cb(res);
        }, function(err) {
            return cb(err);
        });
    },


    getRejectedMetaInfo: function(metaId, cb) {
      var _self = this;
      var res={};

      MetaRejection.find({usermetaid: metaId}, '-_id -__v', function(error, data) {
        if(error || !data || (data && data.length == 0)) {
          res.error = true;
          res.message = 'No previous rejections found.'
          return cb(res);
        }
        else {
          res.error = false;
          res.message = "Previous rejections found";
          res.result = data;
          return cb(res);
        }
      });
    },


    saveKycandUpdateStatus: function (userId, body, cb) {
      var _self = this;
      var res={};
      return _self.findUserMetaById( userId ).then(function(data) {
        res.error = true;
        res.message = "Your KYC is incomplete. Missing : ";
        if ( !data.result.user.govid || data.result.user.govid.trim() == '' ) {
            res.message += "Government Id";
            return cb( res );
        } else if ( !data.result.user.taxid || data.result.user.taxid.trim() == '' ) {
            res.message += "Tax Id";
            return cb( res );
        } else if ( !data.result.s3asset.selfie || data.result.s3asset.selfie.trim() == '' ) {
            res.message += "Selfie Image";
            return cb( res );
        } else if ( !data.result.s3asset.id_1 || data.result.s3asset.id_1.trim() == '' ) {
            res.message += "Photo Proof Image";
            return cb( res );
        } else {
          res.error = false;
          res.message = "Your KYC is complete";

          return _self.canUserEditKyc( userId ).then(function(data) {

            console.log('Yes, user can edit KYC');
            return _self.changeUserKycStatus( userId, body, config.kycFlags.kycPendingFlag.status).then( function(data) {

              return cb(data);

            }, function(err) {

              return cb(err);
            });

          }, function(err) {

            return cb(err);
          });
        }
      }, function(err) {
          return cb(err);
      });
    },


    updateUserKycByAdmin: function(supervisorId, supervisorName, userId, status, comments, body ) {
        var res={};
        return new Promise( function( resolve, reject) {
            if ( _.includes( config.kycFlagsList, status ) ) {
                console.log("pass the test admin");
                var updateObject = {
                  'admin.id': supervisorId,
                  'admin.name': supervisorName,
                  'admin.flag': status,
                  'kyc_flag': status,
                  'admin.viewed': true,
                  'admin.timestamp': (new Date()),
                  'admin.comments': comments,
                  'assetsStatus': body.assetsStatus,
                  'admin.rejectReason': body.rejectReason
                };

                Usermeta.findOneAndUpdate({'user.id': userId}, updateObject, function (err, userMeta) {
                    if (err) {
                        res.error = true;
                        res.message = err;
                        console.log(err);
                        reject(res);
                    }
                    if (userMeta == null) {
                        res.error = true;
                        res.message = "User Kyc record not found";
                        reject(res);
                    } else {
                        res.error = false;
                        res.message = "Status changed to " + status;
                        resolve(res);
                    }
                });
            } else {
                res.error = true;
                res.message = "Invalid Status";
                reject(res);
            }
        });
    },


    updateUserKycByModerator: function(supervisorId, supervisorName, userId, status, comments, body ) {
        var res={};
        return new Promise( function( resolve, reject) {
            if ( _.includes( config.kycFlagsList, status ) ) {
                if ( status !== config.kycFlags.kycApprovedFlag.status ) {
                  var updateObject = {
                      'moderator.flag': status,
                      'kyc_flag': status,
                      'moderator.viewed': true,
                      'moderator.timestamp': (new Date()),
                      'moderator.comments': comments,
                      "moderator.id": supervisorId,
                      "moderator.name": supervisorName,
                      'assetsStatus': body.assetsStatus,
                      'moderator.rejectReason': body.rejectReason
                  };
                    Usermeta.findOneAndUpdate({'user.id': userId}, updateObject, function (err, userMeta) {
                        if (err) {
                            res.error = true;
                            res.message = err;
                            console.log(err);
                            reject(res);
                        }
                        if (userMeta == null) {
                            res.error = true;
                            res.message = "User Kyc record not found";
                            reject(res);
                        } else {
                            res.error = false;
                            res.message = "Status changed to " + status;
                            resolve(res);
                        }
                    });
                   } else {
                    res.error = true;
                    res.message = "You are not authorised to approve";
                    reject(res);
                }
            } else {
                res.error = true;
                res.message = "Invalid Status";
                reject(res);
            }
        });
    },

    addToRejectionLog: function(userId, updateById, updateByName, cb) {
      var _self = this;
      var res = {};
      return new Promise( function( resolve, reject){
          _self.findUserMetaById( userId ).then( function(data) {

            if(data.error) {
              res.error = true;
              res.message = "Unable to add Reject Log ";
              reject(res);
            }
            else {

              MetaRejection.create({
                usermetaid: data.result._id,
                rejectedat: (new Date()),
                rejectById: updateById,
                rejectByName: updateByName,
                rejectReason: (data.result.moderator.rejectReason || data.result.admin.rejectReason),
                s3asset: data.result.s3asset,
                doctypes: data.result.doctypes,
                assetsStatus: data.result.assetsStatus
              }, function(error, rjmeta) {

                if(error) {
                  res.error = true;
                  res.message = "Unable to add Reject Log (save error)";
                  reject(res);
                }
                else {
                  res.error = true;
                  res.message = "Rejection Log Save";
                  resolve(res);
                }
              });
            }

          }, function(err) {
              return cb(err);
          }).then(function (data) {
              return cb(data);
          }, function (err) {
              return cb(err);
          });
      });
    },

    updateUserKyc: function (supervisorId, supervisorName, userId, role, status, comments, body, cb) {
        var _self = this;
        var res={};
        return new Promise( function( resolve, reject){
            _self.findUserMetaById( userId ).then( function(data) {
                if ( role == "supervisor" ){
                    console.log( "Supervisor kyc hit" )
                    return _self.updateUserKycByAdmin(supervisorId, supervisorName, userId, status, comments, body );
                }
                else if ( role == "moderator" ){
                    return _self.updateUserKycByModerator(supervisorId, supervisorName, userId, status, comments, body );
                }
                else {
                    res.error = true;
                    res.message = "You are unauthorised";
                    reject( res );
                }
            }, function(err) {
                return cb(err);
            }).then(function (data) {
                return cb(data);
            }, function (err) {
                return cb(err);
            });
        });

    },


    uploadUserKyc: function (req, cb) {
        var userId = req.user._id;
        var type = req.body.type;
        var doctype = req.body.doctype;
        type = type.replace(/[']+/g, ''); //Remove Single Quotes
        type = type.replace(/["]+/g, ''); //Remove Double Quotes
        var res = {
            error: "",
            message: ""
        };

        var _self = this;

        var promise = _self.isUserUploadTypeValid(type);
        console.log( userId, type );
        promise.then(function (data) {
            return _self.isUserRoleAllowedToUpload(userId);
        }, function (err) {
            return cb(err);
        }).then(function (data) {
            return _self.canUserEditKyc(userId);
        }, function (err) {
            return cb(err);
        }).then(function (data) {
            var fileName = userId + '/' + uuid.v1() + "_kyc";
            console.log( "Upload to S3", data, fileName );
            return _self.uploadKycToS3(req, fileName);
        }, function (err) {
            return cb(err);
        }).then(function (data) {
            console.log( "Upload to DB", data );
            return _self.addKycUploadedDocumentToDB(data.fileName, type, userId, doctype);
        }, function (err) {
            return cb(err);
        }).then(function (data) {
            return cb(data);
        }, function (err) {
            return cb(err);
        });
    },


    /**
     * Returns the user kyc data. TO be viewed on profile page
     * @auth user
     * @param userId
     * @returns {*}
     */
    getUserKycData: function ( userId ) {
        var res = {
            error: "",
            message: ""
        };
        return new Promise( function( resolve, reject ){
            // Find User with given id and get its meta
            Usermeta.findOne({'user.id': userId}, 'user.govid user.taxid kyc_flag s3asset.selfie s3asset.id_1', function (err, userMeta) {
                if (err) {
                    console.log( "Error KYC " , err );
                    res.error = true;
                    res.message = err;
                    return res;
                }
                res.error = false;
                res.result = userMeta;
                return res;
            });
        });
    },


    /**
     * Saves the users gov id.
     * - Check if allowed to update Kyc
     * - Check if Gov Id Valid
     *
     * @auth user,admin
     * @route /save-govid
     * @controller saveGovId
     * @param userId
     * @param govId
     * @param cb
     */
    saveUserGovId: function ( userId, govId, cb ) {
        var _self = this;
        var res = {
            error: "",
            message: ""
        };
        return new Promise( function( resolve, reject ){
            _self.findUserMetaById( userId )
               .then( function( data ){
                if ( _self.isUserKycGovIdValid( govId ) ) {
                    resolve( true );
                } else {
                    res.error = true;
                    res.message = "User Gov Id invalid";
                    reject(res);
                }
            }, function ( err ) {
                return cb(err);
            }).then( function( data ){
                return _self.canUserEditKyc( userId );
            }, function ( err ) {
                return cb(err);
            }).then( function( data ){
                return _self.isUserGovIdUnique( govId );
            }, function ( err ) {
                return cb(err);
            }).then( function( data ){
                return _self.updateUserGovId( userId, govId );
            }, function ( err ) {
                return cb(err);
            }).then(function (data) {
                return cb(data);
            }, function (err) {
                return cb(err);
            });
        });

    },



    /**
     * Saves the users tax id.
     * - Check if allowed to update Kyc
     * - Check if Tax Id Valid
     *
     * @auth user,admin
     * @route /save-taxid
     * @controller saveTaxId
     * @param userId
     * @param taxId
     * @param cb
     */
    saveUserTaxId: function ( userId, taxId, cb ) {
        var _self = this;
        var res = {
            error: "",
            message: ""
        };
        return new Promise( function( resolve, reject ){
            _self.findUserMetaById( userId )
                .then( function( data ){
                if ( _self.isUserKycTaxIdValid( taxId ) ) {
                    resolve( true );
                } else {
                    res.error = true;
                    res.message = "User Tax Id invalid";
                    reject(res);
                }
            }, function ( err ) {
                    return cb(err);
                }).then( function( data ){
                return _self.canUserEditKyc( userId );
            }, function ( err ) {
                return cb(err);
            }).then( function( data ){
                return _self.isUserTaxIdUnique( taxId );
            }, function ( err ) {
                return cb(err);
            }).then( function( data ){
                return _self.updateUserTaxId( userId, taxId );
            }, function ( err ) {
                return cb(err);
            }).then(function (data) {
                return cb(data);
            }, function (err) {
                return cb(err);
            });
        });
    },


    /**
     * Detailed list of the user kyc along with all details
     * @auth admin
     * @route /get-kyc-records
     * @controller getKycRecords
     * @param userStatus
     * @param page
     * @param limit
     * @param searchParam
     * @returns {json} {error: true/false, ,message: "....", data: "....."}
     */
    getUserListByStatus: function (userStatus, page, limit, searchParam, cb) {
        var res = {
            error: "",
            message: ""
        };
        var _self = this;
        var status = userStatus;
        var data = [];
        var conditions = {};

        if ( searchParam == null ) {
            conditions = { 'kyc_flag' : status };
        } else {
            conditions['$or'] = [
                {"user.email": searchParam},
                {"user.id": searchParam},
                {"user.name": {'$regex': searchParam.toLowerCase(), '$options': 'i'}}
            ];
        }

        return new Promise( function(resolve, reject){
            if ( _.isString(status) && ( _.includes( config.kycFlagsList, status ) ) ) {

                var viewLimit   = 50; //@TODO replace this with config param
                var currentPage = parseInt( (page) ? page : 1 );
                var skipRows    = parseInt(limit * (currentPage - 1));

                Usermeta.find(conditions).sort({"updatedAt":1, "_id":1}).skip(skipRows).limit(viewLimit).exec(function (err, userMetas) {
                    if (err) {
                        res.error = true;
                        res.message = err;
                        console.log( err );
                        reject(res);
                    }
                    Usermeta.count(conditions, function(err, rows) {
                      res.error = false;
                      res.message = "Result set fetched";
                      var prevPage = 0;
                      if ( currentPage == 1 ) {
                          prevPage = 0
                      } else{
                          prevPage = currentPage - 1;
                      }
                      res.result = {
                        data: userMetas,
                        limit: viewLimit,
                        total: rows,
                        currentAnchorId : currentPage,
                        prevAnchorId: prevPage,
                        nextAnchorId: (currentPage + 1)
                      };
                      resolve ( res );
                    });
                });
            } else {
                res.error = true;
                res.message = "Invalid status parameter";
                reject( res );
            }
        }).then(function (data) {
            return cb(data);
        }, function (err) {
            return cb(err);
        });
    },


    fetchDataForAdmin: function( data ) {
        return new Promise( function(resolve, reject){
            console.log("Fetch for admin", data);
            resolve( data );
        });

    },


    getUserKycRecord: function( userId, cb ) {
        var res = {
            error: "",
            message: ""
        };
        console.log( "User Id ", userId );
        var _self = this;
        return new Promise( function( resolve, reject ){
            _self.findUserMetaById( userId )
                .then(function (data) {
                    return cb(data);
                }, function (err) {
                    return cb(err);
                });
        } );
    },


    isUserKycRecordVerified: function( userId, cb ) {
        var res1 = {
            error: "",
            message: ""
        };
        var _self = this;

        return _self.findUserMetaById( userId ).then(function(data) {

          if ( (data.result.kyc_flag ==  config.kycFlags.kycApprovedFlag.status) && (data.result.moderator.flag ==  config.kycFlags.kycVerifiedFlag.status) && ( data.result.admin.flag == config.kycFlags.kycApprovedFlag.status ) ) {
              if ( data.result.moderator.viewed && data.result.admin.viewed ) {
                  res1.error = false;
                  res1.message = "Kyc is approved";
                  res1.result = {status: true};
                  return cb(res1);
              }
              else {
                  res1.error = true;
                  res1.message = "Your Kyc status is pending; either by Moderator or by Admin.";
                  return cb(res1);
              }
          } else {
              res1.error = true;
              res1.message = "Request rejected, as your KYC is under approval process.";
              return cb(res1);
          }
        }, function(err) {
          return cb(err);
        });

        // return new Promise( function( resolve, reject ){
        //     _self.findUserMetaById( userId )
        //         .then(function (data) {
        //             console.log(' >  11111');
                    // if ( (data.result.kyc_flag ==  config.kycFlags.kycApprovedFlag.status) && (data.result.moderator.flag ==  config.kycFlags.kycVerifiedFlag.status) && ( data.result.admin.flag == config.kycFlags.kycApprovedFlag.status ) ) {
                    //     if ( data.result.moderator.viewed && data.result.admin.viewed ) {
                    //         res1.error = false;
                    //         res1.message = "Kyc is approved";
                    //         res1.result = {status: true};
                    //         console.log(' >  11112');
                    //         resolve(res1);
                    //     }
                    //     else {
                    //         res1.error = true;
                    //         res1.message = "Kyc has status pending bu either Moderator or Admin ";
                    //         console.log(' >  111113');
                    //         reject(res1);
                    //     }
                    // } else {
                    //     res1.error = true;
                    //     res1.message = "Request rejected, pending approval ";
                    //     console.log(' >  11114');
                    //     reject(res1);
                    // }
        //         }, function (err) {
        //             console.log(' >  11115');
        //             return cb(err);
        //         }).then(function (data) {
        //             console.log(' >  11116', data);
        //             return cb(data);
        //         }, function (err) {
        //             console.log(' >  11117');
        //             return cb(err);
        //         });
        // } );
    }



};

module.exports = KycComponents;
