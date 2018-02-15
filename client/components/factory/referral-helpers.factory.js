angular.module('iCoinApp')
.factory('ReferralHelpers', function () {
    return {

      encodeReference: function (encodeString) {
        return btoa(encodeURIComponent(encodeString).replace(/%([0-9A-F]{2})/g, function (mstr, pstr) {
          return String.fromCharCode('0x' + pstr);
      }));
    },

    decodeReference: function (decodeString) {
        var decodeStr = decodeString.replace(/\s/g, '+').replace(/\"/g, '');
        return decodeURIComponent(escape(atob(decodeStr)));
    }
};
});