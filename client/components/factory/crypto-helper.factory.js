angular.module('iCoinApp')
.factory('CryptoHelper', function (CRYPTO_KEY) {
    return {
        encrypt: function (plainString) {
            return CryptoJS.AES.encrypt(plainString, CRYPTO_KEY).toString();
        },
        decrypt: function (encryptedString) {
          var decryptedData = CryptoJS.AES.decrypt(encryptedString, CRYPTO_KEY);
          return decryptedData.toString(CryptoJS.enc.Utf8);
      }
  };
});