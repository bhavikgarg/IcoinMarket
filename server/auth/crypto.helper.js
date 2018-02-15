'use strict';

var cryptoHelper = require("crypto-js");
var CRYPTO_KEY = 'SUNNeVpFdFJabkdFTTB3MFZGazNXV3RDZmgwOQ==';

module.exports = {
	/* Method to encrypt */
	encrypt: function (plainString) {
    	return cryptoHelper.AES.encrypt(plainString, CRYPTO_KEY).toString();
	},

	/* Method to decrypt */
	decrypt : function (encryptedString) {
	  var decryptedData = cryptoHelper.AES.decrypt(encryptedString, CRYPTO_KEY);
	    return decryptedData.toString(cryptoHelper.enc.Utf8);
	}
};