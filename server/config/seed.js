/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var mongoose = require('mongoose');
var config = require('./environment');

mongoose.createConnection(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
   console.error('MongoDB connection error: ' + err);
   process.exit(-1);
});


//var Thing = require('../api/thing/thing.model');
var User = require('../api/user/user.model');
var Countries = require('../api/utilities/countries.model');

User.find({}).exec(function(err, data) {
   console.log('Seed data');
   console.log(data);
   if (!data || data.length == 0) {
      User.create({
         provider: 'local',
         role: 'admin',
         name: 'Admin',
         email: 'admin@admin.com',
         password: 'e4ddc87acd~1',
         userProfileId: 1,
         verified: true
      }, {
         _id: '569764a66110ef9f6810c2ea',
         provider: 'local',
         role: 'user',
         name: 'ICoin Company',
         email: 'noreply@icoin.com',
         password: '9f6810c2ea',
         countryCode: 'US',
         countryName: 'United States',
         username: 'icoincompany',
         userProfileId: 2,
         verified: true
      }, {
         "_id": "56cf0041bd4d969d59534457",
         "userProfileId": 0,
         role: 'solo',
         provider: 'local',
         password: 'justa',
         countryCode: 'US',
         countryName: 'United States',
         username: 'soloads-admin',
         name: 'Solo Ads Admin',
         verified: true
      }, function() {
         console.log('finished populating users');
      });
   }
});


Countries.find({}).exec(function(err, data) {
  if(!data || data.length == 0) {
    Countries.create({ "name": "Afghanistan", "code": "AF" },
{ "name": "Åland Islands", "code": "AX" },
{ "name": "Albania", "code": "AL" },
{ "name": "Algeria", "code": "DZ" },
{ "name": "American Samoa", "code": "AS" },
{ "name": "Andorra", "code": "AD" },
{ "name": "Angola", "code": "AO" },
{ "name": "Anguilla", "code": "AI" },
{ "name": "Antarctica", "code": "AQ" },
{ "name": "Antigua and Barbuda", "code": "AG" },
{ "name": "Argentina", "code": "AR" },
{ "name": "Armenia", "code": "AM" },
{ "name": "Aruba", "code": "AW" },
{ "name": "Australia", "code": "AU" },
{ "name": "Austria", "code": "AT" },
{ "name": "Azerbaijan", "code": "AZ" },
{ "name": "Bahamas", "code": "BS" },
{ "name": "Bahrain", "code": "BH" },
{ "name": "Bangladesh", "code": "BD" },
{ "name": "Barbados", "code": "BB" },
{ "name": "Belarus", "code": "BY" },
{ "name": "Belgium", "code": "BE" },
{ "name": "Belize", "code": "BZ" },
{ "name": "Benin", "code": "BJ" },
{ "name": "Bermuda", "code": "BM" },
{ "name": "Bhutan", "code": "BT" },
{ "name": "Bolivia", "code": "BO" },
{ "name": "Bosnia and Herzegovina", "code": "BA" },
{ "name": "Botswana", "code": "BW" },
{ "name": "Bouvet Island", "code": "BV" },
{ "name": "Brazil", "code": "BR" },
{ "name": "British Indian Ocean Territory", "code": "IO" },
{ "name": "Brunei Darussalam", "code": "BN" },
{ "name": "Bulgaria", "code": "BG" },
{ "name": "Burkina Faso", "code": "BF" },
{ "name": "Burundi", "code": "BI" },
{ "name": "Cambodia", "code": "KH" },
{ "name": "Cameroon", "code": "CM" },
{ "name": "Canada", "code": "CA" },
{ "name": "Cape Verde", "code": "CV" },
{ "name": "Cayman Islands", "code": "KY" },
{ "name": "Central African Republic", "code": "CF" },
{ "name": "Chad", "code": "TD" },
{ "name": "Chile", "code": "CL" },
{ "name": "China", "code": "CN" },
{ "name": "Christmas Island", "code": "CX" },
{ "name": "Cocos (Keeling) Islands", "code": "CC" },
{ "name": "Colombia", "code": "CO" },
{ "name": "Comoros", "code": "KM" },
{ "name": "Congo", "code": "CG" },
{ "name": "Congo, The Democratic Republic of the", "code": "CD" },
{ "name": "Cook Islands", "code": "CK" },
{ "name": "Costa Rica", "code": "CR" },
{ "name": "Cote D'Ivoire", "code": "CI" },
{ "name": "Croatia", "code": "HR" },
{ "name": "Cuba", "code": "CU" },
{ "name": "Cyprus", "code": "CY" },
{ "name": "Czech Republic", "code": "CZ" },
{ "name": "Denmark", "code": "DK" },
{ "name": "Djibouti", "code": "DJ" },
{ "name": "Dominica", "code": "DM" },
{ "name": "Dominican Republic", "code": "DO" },
{ "name": "Ecuador", "code": "EC" },
{ "name": "Egypt", "code": "EG" },
{ "name": "El Salvador", "code": "SV" },
{ "name": "Equatorial Guinea", "code": "GQ" },
{ "name": "Eritrea", "code": "ER" },
{ "name": "Estonia", "code": "EE" },
{ "name": "Ethiopia", "code": "ET" },
{ "name": "Falkland Islands (Malvinas)", "code": "FK" },
{ "name": "Faroe Islands", "code": "FO" },
{ "name": "Fiji", "code": "FJ" },
{ "name": "Finland", "code": "FI" },
{ "name": "France", "code": "FR" },
{ "name": "French Guiana", "code": "GF" },
{ "name": "French Polynesia", "code": "PF" },
{ "name": "French Southern Territories", "code": "TF" },
{ "name": "Gabon", "code": "GA" },
{ "name": "Gambia", "code": "GM" },
{ "name": "Georgia", "code": "GE" },
{ "name": "Germany", "code": "DE" },
{ "name": "Ghana", "code": "GH" },
{ "name": "Gibraltar", "code": "GI" },
{ "name": "Greece", "code": "GR" },
{ "name": "Greenland", "code": "GL" },
{ "name": "Grenada", "code": "GD" },
{ "name": "Guadeloupe", "code": "GP" },
{ "name": "Guam", "code": "GU" },
{ "name": "Guatemala", "code": "GT" },
{ "name": "Guernsey", "code": "GG" },
{ "name": "Guinea", "code": "GN" },
{ "name": "Guinea-Bissau", "code": "GW" },
{ "name": "Guyana", "code": "GY" },
{ "name": "Haiti", "code": "HT" },
{ "name": "Heard Island and Mcdonald Islands", "code": "HM" },
{ "name": "Holy See (Vatican City State)", "code": "VA" },
{ "name": "Honduras", "code": "HN" },
{ "name": "Hong Kong", "code": "HK" },
{ "name": "Hungary", "code": "HU" },
{ "name": "Iceland", "code": "IS" },
{ "name": "India", "code": "IN" },
{ "name": "Indonesia", "code": "ID" },
{ "name": "Iran, Islamic Republic Of", "code": "IR" },
{ "name": "Iraq", "code": "IQ" },
{ "name": "Ireland", "code": "IE" },
{ "name": "Isle of Man", "code": "IM" },
{ "name": "Israel", "code": "IL" },
{ "name": "Italy", "code": "IT" },
{ "name": "Jamaica", "code": "JM" },
{ "name": "Japan", "code": "JP" },
{ "name": "Jersey", "code": "JE" },
{ "name": "Jordan", "code": "JO" },
{ "name": "Kazakhstan", "code": "KZ" },
{ "name": "Kenya", "code": "KE" },
{ "name": "Kiribati", "code": "KI" },
{ "name": "Democratic People's Republic of Korea", "code": "KP" },
{ "name": "Korea, Republic of", "code": "KR" },
{ "name": "Kosovo", "code": "XK" },
{ "name": "Kuwait", "code": "KW" },
{ "name": "Kyrgyzstan", "code": "KG" },
{ "name": "Lao People's Democratic Republic", "code": "LA" },
{ "name": "Latvia", "code": "LV" },
{ "name": "Lebanon", "code": "LB" },
{ "name": "Lesotho", "code": "LS" },
{ "name": "Liberia", "code": "LR" },
{ "name": "Libyan Arab Jamahiriya", "code": "LY" },
{ "name": "Liechtenstein", "code": "LI" },
{ "name": "Lithuania", "code": "LT" },
{ "name": "Luxembourg", "code": "LU" },
{ "name": "Macao", "code": "MO" },
{ "name": "Macedonia, The Former Yugoslav Republic of", "code": "MK" },
{ "name": "Madagascar", "code": "MG" },
{ "name": "Malawi", "code": "MW" },
{ "name": "Malaysia", "code": "MY" },
{ "name": "Maldives", "code": "MV" },
{ "name": "Mali", "code": "ML" },
{ "name": "Malta", "code": "MT" },
{ "name": "Marshall Islands", "code": "MH" },
{ "name": "Martinique", "code": "MQ" },
{ "name": "Mauritania", "code": "MR" },
{ "name": "Mauritius", "code": "MU" },
{ "name": "Mayotte", "code": "YT" },
{ "name": "Mexico", "code": "MX" },
{ "name": "Micronesia, Federated States of", "code": "FM" },
{ "name": "Moldova, Republic of", "code": "MD" },
{ "name": "Monaco", "code": "MC" },
{ "name": "Mongolia", "code": "MN" },
{ "name": "Montenegro", "code": "ME" },
{ "name": "Montserrat", "code": "MS" },
{ "name": "Morocco", "code": "MA" },
{ "name": "Mozambique", "code": "MZ" },
{ "name": "Myanmar", "code": "MM" },
{ "name": "Namibia", "code": "NA" },
{ "name": "Nauru", "code": "NR" },
{ "name": "Nepal", "code": "NP" },
{ "name": "Netherlands", "code": "NL" },
{ "name": "Netherlands Antilles", "code": "AN" },
{ "name": "New Caledonia", "code": "NC" },
{ "name": "New Zealand", "code": "NZ" },
{ "name": "Nicaragua", "code": "NI" },
{ "name": "Niger", "code": "NE" },
{ "name": "Nigeria", "code": "NG" },
{ "name": "Niue", "code": "NU" },
{ "name": "Norfolk Island", "code": "NF" },
{ "name": "Northern Mariana Islands", "code": "MP" },
{ "name": "Norway", "code": "NO" },
{ "name": "Oman", "code": "OM" },
{ "name": "Pakistan", "code": "PK" },
{ "name": "Palau", "code": "PW" },
{ "name": "Palestinian Territory, Occupied", "code": "PS" },
{ "name": "Panama", "code": "PA" },
{ "name": "Papua New Guinea", "code": "PG" },
{ "name": "Paraguay", "code": "PY" },
{ "name": "Peru", "code": "PE" },
{ "name": "Philippines", "code": "PH" },
{ "name": "Pitcairn", "code": "PN" },
{ "name": "Poland", "code": "PL" },
{ "name": "Portugal", "code": "PT" },
{ "name": "Puerto Rico", "code": "PR" },
{ "name": "Qatar", "code": "QA" },
{ "name": "Reunion", "code": "RE" },
{ "name": "Romania", "code": "RO" },
{ "name": "Russian Federation", "code": "RU" },
{ "name": "Rwanda", "code": "RW" },
{ "name": "Saint Helena", "code": "SH" },
{ "name": "Saint Kitts and Nevis", "code": "KN" },
{ "name": "Saint Lucia", "code": "LC" },
{ "name": "Saint Pierre and Miquelon", "code": "PM" },
{ "name": "Saint Vincent and the Grenadines", "code": "VC" },
{ "name": "Samoa", "code": "WS" },
{ "name": "San Marino", "code": "SM" },
{ "name": "Sao Tome and Principe", "code": "ST" },
{ "name": "Saudi Arabia", "code": "SA" },
{ "name": "Senegal", "code": "SN" },
{ "name": "Serbia", "code": "RS" },
{ "name": "Seychelles", "code": "SC" },
{ "name": "Sierra Leone", "code": "SL" },
{ "name": "Singapore", "code": "SG" },
{ "name": "Slovakia", "code": "SK" },
{ "name": "Slovenia", "code": "SI" },
{ "name": "Solomon Islands", "code": "SB" },
{ "name": "Somalia", "code": "SO" },
{ "name": "South Africa", "code": "ZA" },
{ "name": "South Georgia and the South Sandwich Islands", "code": "GS" },
{ "name": "Spain", "code": "ES" },
{ "name": "Sri Lanka", "code": "LK" },
{ "name": "Sudan", "code": "SD" },
{ "name": "Suriname", "code": "SR" },
{ "name": "Svalbard and Jan Mayen", "code": "SJ" },
{ "name": "Swaziland", "code": "SZ" },
{ "name": "Sweden", "code": "SE" },
{ "name": "Switzerland", "code": "CH" },
{ "name": "Syrian Arab Republic", "code": "SY" },
{ "name": "Taiwan", "code": "TW" },
{ "name": "Tajikistan", "code": "TJ" },
{ "name": "Tanzania, United Republic of", "code": "TZ" },
{ "name": "Thailand", "code": "TH" },
{ "name": "Timor-Leste", "code": "TL" },
{ "name": "Togo", "code": "TG" },
{ "name": "Tokelau", "code": "TK" },
{ "name": "Tonga", "code": "TO" },
{ "name": "Trinidad and Tobago", "code": "TT" },
{ "name": "Tunisia", "code": "TN" },
{ "name": "Turkey", "code": "TR" },
{ "name": "Turkmenistan", "code": "TM" },
{ "name": "Turks and Caicos Islands", "code": "TC" },
{ "name": "Tuvalu", "code": "TV" },
{ "name": "Uganda", "code": "UG" },
{ "name": "Ukraine", "code": "UA" },
{ "name": "United Arab Emirates", "code": "AE" },
{ "name": "United Kingdom", "code": "GB" },
{ "name": "United States", "code": "US" },
{ "name": "United States Minor Outlying Islands", "code": "UM" },
{ "name": "Uruguay", "code": "UY" },
{ "name": "Uzbekistan", "code": "UZ" },
{ "name": "Vanuatu", "code": "VU" },
{ "name": "Venezuela", "code": "VE" },
{ "name": "Viet Nam", "code": "VN" },
{ "name": "Virgin Islands, British", "code": "VG" },
{ "name": "Virgin Islands, U.S.", "code": "VI" },
{ "name": "Wallis and Futuna", "code": "WF" },
{ "name": "Western Sahara", "code": "EH" },
{ "name": "Yemen", "code": "YE" },
{ "name": "Zambia", "code": "ZM" },
{ "name": "Zimbabwe", "code": "ZW" },
{ "name": "Россия", code: "RU", "dial_code": "+7" },
{ "name": "Srilanka", code: "LK", "dial_code": "+94"},
{ "name": "Belgium", code: "BE", "dial_code": "+32"},
{ "name": "Italia", code: "IT", "dial_code": "+39"},
{ "name": "Seoul", code: "KR", "dial_code": "+82"},
{ "name": "Scotland", code: "UK", "dial_code": "+44"},
{ "name": "UAE", code: 'AE', "dial_code": "+971" },
{ "name": "Trinidad & Tobago", "code": "TT", "dial_code": "+1 868"}, function() {
        console.log('finished populating countries');

        // Adding ISD Codes
        Countries.update({"code": "AF"}, {"dial_code": "+93"}, function() { console.log('country updated'); })
        Countries.update({"code": "AX"}, {"dial_code": "+358"}, function() { console.log('country updated'); })
        Countries.update({"code": "AL"}, {"dial_code": "+355"}, function() { console.log('country updated'); })
        Countries.update({"code": "DZ"}, {"dial_code": "+213"}, function() { console.log('country updated'); })
        Countries.update({"code": "AS"}, {"dial_code": "+1 684"}, function() { console.log('country updated'); })
        Countries.update({"code": "AD"}, {"dial_code": "+376"}, function() { console.log('country updated'); })
        Countries.update({"code": "AO"}, {"dial_code": "+244"}, function() { console.log('country updated'); })
        Countries.update({"code": "AI"}, {"dial_code": "+1 264"}, function() { console.log('country updated'); })
        Countries.update({"code": "AQ"}, {"dial_code": "+672"}, function() { console.log('country updated'); })
        Countries.update({"code": "AG"}, {"dial_code": "+1268"}, function() { console.log('country updated'); })
        Countries.update({"code": "AR"} ,{"dial_code": "+54"}, function() { console.log('country updated'); })
        Countries.update({"code": "AM"}, {"dial_code": "+374"}, function() { console.log('country updated'); })
        Countries.update({"code": "AW"}, {"dial_code": "+297"}, function() { console.log('country updated'); })
        Countries.update({"code": "AU"}, {"dial_code": "+61"}, function() { console.log('country updated'); })
        Countries.update({"code": "AT"}, {"dial_code": "+43"}, function() { console.log('country updated'); })
        Countries.update({"code": "AZ"}, {"dial_code": "+994"}, function() { console.log('country updated'); })
        Countries.update({"code": "BS"}, {"dial_code": "+1 242"}, function() { console.log('country updated'); })
        Countries.update({"code": "BH"}, {"dial_code": "+973"}, function() { console.log('country updated'); })
        Countries.update({"code": "BD"}, {"dial_code": "+880"}, function() { console.log('country updated'); })
        Countries.update({"code": "BB"}, {"dial_code": "+1 246"}, function() { console.log('country updated'); })

        Countries.update({"code": "BY"}, {"dial_code": "+375"}, function() { console.log('country updated'); })
        Countries.update({"code": "BE"}, {"dial_code": "+32"}, function() { console.log('country updated'); })
        Countries.update({"code": "BZ"}, {"dial_code": "+501"}, function() { console.log('country updated'); })
        Countries.update({"code": "BJ"}, {"dial_code": "+229"}, function() { console.log('country updated'); })
        Countries.update({"code": "BM"}, {"dial_code": "+1 441"}, function() { console.log('country updated'); })
        Countries.update({"code": "BT"}, {"dial_code": "+975"}, function() { console.log('country updated'); })
        Countries.update({"code": "BO"}, {"dial_code": "+591"}, function() { console.log('country updated'); })
        Countries.update({"code": "BA"}, {"dial_code": "+387"}, function() { console.log('country updated'); })
        Countries.update({"code": "BW"}, {"dial_code": "+267"}, function() { console.log('country updated'); })
        Countries.update({"code": "BR"}, {"dial_code": "+55"}, function() { console.log('country updated'); })
        Countries.update({"code": "IO"}, {"dial_code": "+246"}, function() { console.log('country updated'); })
        Countries.update({"code": "BN"}, {"dial_code": "+673"}, function() { console.log('country updated'); })
        Countries.update({"code": "BG"}, {"dial_code": "+359"}, function() { console.log('country updated'); })
        Countries.update({"code": "BF"}, {"dial_code": "+226"}, function() { console.log('country updated'); })
        Countries.update({"code": "BI"}, {"dial_code": "+257"}, function() { console.log('country updated'); })
        Countries.update({"code": "KH"}, {"dial_code": "+855"}, function() { console.log('country updated'); })
        Countries.update({"code": "CM"}, {"dial_code": "+237"}, function() { console.log('country updated'); })
        Countries.update({"code": "CA"}, {"dial_code": "+1"}, function() { console.log('country updated'); })
        Countries.update({"code": "CV"}, {"dial_code": "+238"}, function() { console.log('country updated'); })
        Countries.update({"code": "KY"}, {"dial_code": "+345"}, function() { console.log('country updated'); })
        Countries.update({"code": "CF"}, {"dial_code": "+236"}, function() { console.log('country updated'); })

        Countries.update({"code": "TD"}, {"dial_code": "+235"}, function() { console.log('country updated'); })
        Countries.update({"code": "CL"}, {"dial_code": "+56"}, function() { console.log('country updated'); })
        Countries.update({"code": "CN"}, {"dial_code": "+86"}, function() { console.log('country updated'); })
        Countries.update({"code": "CX"}, {"dial_code": "+61"}, function() { console.log('country updated'); })
        Countries.update({"code": "CC"}, {"dial_code": "+61"}, function() { console.log('country updated'); })
        Countries.update({"code": "CO"}, {"dial_code": "+57"}, function() { console.log('country updated'); })
        Countries.update({"code": "KM"}, {"dial_code": "+269"}, function() { console.log('country updated'); })
        Countries.update({"code": "CG"}, {"dial_code": "+242"}, function() { console.log('country updated'); })
        Countries.update({"code": "CD"}, {"dial_code": "+243"}, function() { console.log('country updated'); })
        Countries.update({"code": "CK"}, {"dial_code": "+682"}, function() { console.log('country updated'); })
        Countries.update({"code": "CR"}, {"dial_code": "+506"}, function() { console.log('country updated'); })
        Countries.update({"code": "CI"}, {"dial_code": "+225"}, function() { console.log('country updated'); })
        Countries.update({"code": "HR"}, {"dial_code": "+385"}, function() { console.log('country updated'); })
        Countries.update({"code": "CU"}, {"dial_code": "+53"}, function() { console.log('country updated'); })
        Countries.update({"code": "CY"}, {"dial_code": "+357"}, function() { console.log('country updated'); })
        Countries.update({"code": "CZ"}, {"dial_code": "+420"}, function() { console.log('country updated'); })
        Countries.update({"code": "DK"}, {"dial_code": "+45"}, function() { console.log('country updated'); })
        Countries.update({"code": "DJ"}, {"dial_code": "+253"}, function() { console.log('country updated'); })
        Countries.update({"code": "DM"}, {"dial_code": "+1 767"}, function() { console.log('country updated'); })
        Countries.update({"code": "DO"}, {"dial_code": "+1 849"}, function() { console.log('country updated'); })
        Countries.update({"code": "EC"}, {"dial_code": "+593"}, function() { console.log('country updated'); })
        Countries.update({"code": "EG"}, {"dial_code": "+20"}, function() { console.log('country updated'); })

        Countries.update({"code": "SV"}, {"dial_code": "+503"}, function() { console.log('country updated'); })
        Countries.update({"code": "GQ"}, {"dial_code": "+240"}, function() { console.log('country updated'); })
        Countries.update({"code": "ER"}, {"dial_code": "+291"}, function() { console.log('country updated'); })
        Countries.update({"code": "EE"}, {"dial_code": "+372"}, function() { console.log('country updated'); })
        Countries.update({"code": "ET"}, {"dial_code": "+251"}, function() { console.log('country updated'); })
        Countries.update({"code": "FK"}, {"dial_code": "+500"}, function() { console.log('country updated'); })
        Countries.update({"code": "FO"}, {"dial_code": "+298"}, function() { console.log('country updated'); })
        Countries.update({"code": "FJ"}, {"dial_code": "+679"}, function() { console.log('country updated'); })
        Countries.update({"code": "FI"}, {"dial_code": "+358"}, function() { console.log('country updated'); })
        Countries.update({"code": "FR"}, {"dial_code": "+33"}, function() { console.log('country updated'); })
        Countries.update({"code": "GF"}, {"dial_code": "+594"}, function() { console.log('country updated'); })
        Countries.update({"code": "PF"}, {"dial_code": "+689"}, function() { console.log('country updated'); })
        Countries.update({"code": "GA"}, {"dial_code": "+241"}, function() { console.log('country updated'); })
        Countries.update({"code": "GM"}, {"dial_code": "+220"}, function() { console.log('country updated'); })
        Countries.update({"code": "GE"}, {"dial_code": "+995"}, function() { console.log('country updated'); })
        Countries.update({"code": "DE"}, {"dial_code": "+49"}, function() { console.log('country updated'); })

        Countries.update({"code": "GH"}, {"dial_code": "+233"}, function() { console.log('country updated'); })
        Countries.update({"code": "GI"}, {"dial_code": "+350"}, function() { console.log('country updated'); })
        Countries.update({"code": "GR"}, {"dial_code": "+30"}, function() { console.log('country updated'); })
        Countries.update({"code": "GL"}, {"dial_code": "+299"}, function() { console.log('country updated'); })
        Countries.update({"code": "GD"}, {"dial_code": "+1 473"}, function() { console.log('country updated'); })
        Countries.update({"code": "GP"}, {"dial_code": "+590"}, function() { console.log('country updated'); })
        Countries.update({"code": "GU"}, {"dial_code": "+1 671"}, function() { console.log('country updated'); })
        Countries.update({"code": "GT"}, {"dial_code": "+502"}, function() { console.log('country updated'); })
        Countries.update({"code": "GG"}, {"dial_code": "+44"}, function() { console.log('country updated'); })
        Countries.update({"code": "GN"}, {"dial_code": "+224"}, function() { console.log('country updated'); })
        Countries.update({"code": "GW"}, {"dial_code": "+245"}, function() { console.log('country updated'); })
        Countries.update({"code": "GY"}, {"dial_code": "+595"}, function() { console.log('country updated'); })
        Countries.update({"code": "HT"}, {"dial_code": "+509"}, function() { console.log('country updated'); })
        Countries.update({"code": "VA"}, {"dial_code": "+379"}, function() { console.log('country updated'); })
        Countries.update({"code": "HN"}, {"dial_code": "+504"}, function() { console.log('country updated'); })
        Countries.update({"code": "HK"}, {"dial_code": "+852"}, function() { console.log('country updated'); })
        Countries.update({"code": "HU"}, {"dial_code": "+36"}, function() { console.log('country updated'); })
        Countries.update({"code": "IS"}, {"dial_code": "+354"}, function() { console.log('country updated'); })

        Countries.update({"code": "IN"}, {"dial_code": "+91"}, function() { console.log('country updated'); })
        Countries.update({"code": "ID"}, {"dial_code": "+62"}, function() { console.log('country updated'); })
        Countries.update({"code": "IR"}, {"dial_code": "+98"}, function() { console.log('country updated'); })
        Countries.update({"code": "IQ"}, {"dial_code": "+964"}, function() { console.log('country updated'); })
        Countries.update({"code": "IE"}, {"dial_code": "+353"}, function() { console.log('country updated'); })
        Countries.update({"code": "IM"}, {"dial_code": "+44"}, function() { console.log('country updated'); })
        Countries.update({"code": "IL"}, {"dial_code": "+972"}, function() { console.log('country updated'); })
        Countries.update({"code": "IT"}, {"dial_code": "+39"}, function() { console.log('country updated'); })
        Countries.update({"code": "JM"}, {"dial_code": "+1 876"}, function() { console.log('country updated'); })
        Countries.update({"code": "JP"}, {"dial_code": "+81"}, function() { console.log('country updated'); })
        Countries.update({"code": "JE"}, {"dial_code": "+44"}, function() { console.log('country updated'); })
        Countries.update({"code": "JO"}, {"dial_code": "+962"}, function() { console.log('country updated'); })
        Countries.update({"code": "KZ"}, {"dial_code": "+7 7"}, function() { console.log('country updated'); })
        Countries.update({"code": "KE"}, {"dial_code": "+254"}, function() { console.log('country updated'); })
        Countries.update({"code": "KI"}, {"dial_code": "+686"}, function() { console.log('country updated'); })
        Countries.update({"code": "KP"}, {"dial_code": "+850"}, function() { console.log('country updated'); })

        Countries.update({"code": "KR"}, {"dial_code": "+82"}, function() { console.log('country updated'); })
        Countries.update({"code": "KW"}, {"dial_code": "+965"}, function() { console.log('country updated'); })
        Countries.update({"code": "KG"}, {"dial_code": "+996"}, function() { console.log('country updated'); })
        Countries.update({"code": "LA"}, {"dial_code": "+856"}, function() { console.log('country updated'); })
        Countries.update({"code": "LV"}, {"dial_code": "+371"}, function() { console.log('country updated'); })
        Countries.update({"code": "LB"}, {"dial_code": "+961"}, function() { console.log('country updated'); })
        Countries.update({"code": "LS"}, {"dial_code": "+266"}, function() { console.log('country updated'); })
        Countries.update({"code": "LR"}, {"dial_code": "+231"}, function() { console.log('country updated'); })
        Countries.update({"code": "LY"}, {"dial_code": "+218"}, function() { console.log('country updated'); })
        Countries.update({"code": "LI"}, {"dial_code": "+423"}, function() { console.log('country updated'); })
        Countries.update({"code": "LT"}, {"dial_code": "+370"}, function() { console.log('country updated'); })
        Countries.update({"code": "LU"}, {"dial_code": "+352"}, function() { console.log('country updated'); })
        Countries.update({"code": "MO"}, {"dial_code": "+853"}, function() { console.log('country updated'); })
        Countries.update({"code": "MK"}, {"dial_code": "+389"}, function() { console.log('country updated'); })
        Countries.update({"code": "MG"}, {"dial_code": "+261"}, function() { console.log('country updated'); })
        Countries.update({"code": "MW"}, {"dial_code": "+265"}, function() { console.log('country updated'); })

        Countries.update({"code": "MY"}, {"dial_code": "+60"}, function() { console.log('country updated'); })
        Countries.update({"code": "MV"}, {"dial_code": "+960"}, function() { console.log('country updated'); })
        Countries.update({"code": "ML"}, {"dial_code": "+223"}, function() { console.log('country updated'); })
        Countries.update({"code": "MT"}, {"dial_code": "+356"}, function() { console.log('country updated'); })
        Countries.update({"code": "MH"}, {"dial_code": "+692"}, function() { console.log('country updated'); })
        Countries.update({"code": "MQ"}, {"dial_code": "+596"}, function() { console.log('country updated'); })
        Countries.update({"code": "MR"}, {"dial_code": "+222"}, function() { console.log('country updated'); })
        Countries.update({"code": "MU"}, {"dial_code": "+230"}, function() { console.log('country updated'); })
        Countries.update({"code": "YT"}, {"dial_code": "+262"}, function() { console.log('country updated'); })
        Countries.update({"code": "MX"}, {"dial_code": "+52"}, function() { console.log('country updated'); })
        Countries.update({"code": "FM"}, {"dial_code": "+691"}, function() { console.log('country updated'); })
        Countries.update({"code": "MD"}, {"dial_code": "+373"}, function() { console.log('country updated'); })
        Countries.update({"code": "MC"}, {"dial_code": "+377"}, function() { console.log('country updated'); })
        Countries.update({"code": "MN"}, {"dial_code": "+976"}, function() { console.log('country updated'); })
        Countries.update({"code": "ME"}, {"dial_code": "+382"}, function() { console.log('country updated'); })
        Countries.update({"code": "MS"}, {"dial_code": "+1664"}, function() { console.log('country updated'); })

        Countries.update({"code": "MA"}, {"dial_code": "+212"}, function() { console.log('country updated'); })
        Countries.update({"code": "MZ"}, {"dial_code": "+258"}, function() { console.log('country updated'); })
        Countries.update({"code": "MM"}, {"dial_code": "+95"}, function() { console.log('country updated'); })
        Countries.update({"code": "NA"}, {"dial_code": "+264"}, function() { console.log('country updated'); })
        Countries.update({"code": "NR"}, {"dial_code": "+674"}, function() { console.log('country updated'); })
        Countries.update({"code": "NP"}, {"dial_code": "+977"}, function() { console.log('country updated'); })
        Countries.update({"code": "NL"}, {"dial_code": "+31"}, function() { console.log('country updated'); })
        Countries.update({"code": "AN"}, {"dial_code": "+599"}, function() { console.log('country updated'); })
        Countries.update({"code": "NC"}, {"dial_code": "+687"}, function() { console.log('country updated'); })
        Countries.update({"code": "NZ"}, {"dial_code": "+64"}, function() { console.log('country updated'); })
        Countries.update({"code": "NI"}, {"dial_code": "+505"}, function() { console.log('country updated'); })
        Countries.update({"code": "NE"}, {"dial_code": "+227"}, function() { console.log('country updated'); })
        Countries.update({"code": "NG"}, {"dial_code": "+234"}, function() { console.log('country updated'); })
        Countries.update({"code": "NU"}, {"dial_code": "+683"}, function() { console.log('country updated'); })
        Countries.update({"code": "NF"}, {"dial_code": "+672"}, function() { console.log('country updated'); })
        Countries.update({"code": "MP"}, {"dial_code": "+1 670"}, function() { console.log('country updated'); })

        Countries.update({"code": "NO"}, {"dial_code": "+47"}, function() { console.log('country updated'); })
        Countries.update({"code": "OM"}, {"dial_code": "+968"}, function() { console.log('country updated'); })
        Countries.update({"code": "PK"}, {"dial_code": "+92"}, function() { console.log('country updated'); })
        Countries.update({"code": "PW"}, {"dial_code": "+680"}, function() { console.log('country updated'); })
        Countries.update({"code": "PS"}, {"dial_code": "+970"}, function() { console.log('country updated'); })
        Countries.update({"code": "PA"}, {"dial_code": "+507"}, function() { console.log('country updated'); })
        Countries.update({"code": "PG"}, {"dial_code": "+675"}, function() { console.log('country updated'); })
        Countries.update({"code": "PY"}, {"dial_code": "+595"}, function() { console.log('country updated'); })
        Countries.update({"code": "PE"}, {"dial_code": "+51"}, function() { console.log('country updated'); })
        Countries.update({"code": "PH"}, {"dial_code": "+63"}, function() { console.log('country updated'); })
        Countries.update({"code": "PN"}, {"dial_code": "+872"}, function() { console.log('country updated'); })
        Countries.update({"code": "PL"}, {"dial_code": "+48"}, function() { console.log('country updated'); })
        Countries.update({"code": "PT"}, {"dial_code": "+351"}, function() { console.log('country updated'); })
        Countries.update({"code": "PR"}, {"dial_code": "+1 939"}, function() { console.log('country updated'); })
        Countries.update({"code": "QA"}, {"dial_code": "+974"}, function() { console.log('country updated'); })
        Countries.update({"code": "RO"}, {"dial_code": "+40"}, function() { console.log('country updated'); })

        Countries.update({"code": "RU"}, {"dial_code": "+7"}, function() { console.log('country updated'); })
        Countries.update({"code": "RW"}, {"dial_code": "+250"}, function() { console.log('country updated'); })
        Countries.update({"code": "RE"}, {"dial_code": "+262"}, function() { console.log('country updated'); })
        Countries.update({"code": "BL"}, {"dial_code": "+590"}, function() { console.log('country updated'); })
        Countries.update({"code": "SH"}, {"dial_code": "+290"}, function() { console.log('country updated'); })
        Countries.update({"code": "KN"}, {"dial_code": "+1 869"}, function() { console.log('country updated'); })
        Countries.update({"code": "LC"}, {"dial_code": "+1 758"}, function() { console.log('country updated'); })
        Countries.update({"code": "MF"}, {"dial_code": "+590"}, function() { console.log('country updated'); })
        Countries.update({"code": "PM"}, {"dial_code": "+508"}, function() { console.log('country updated'); })
        Countries.update({"code": "VC"}, {"dial_code": "+1 784"}, function() { console.log('country updated'); })
        Countries.update({"code": "WS"}, {"dial_code": "+685"}, function() { console.log('country updated'); })
        Countries.update({"code": "SM"}, {"dial_code": "+378"}, function() { console.log('country updated'); })
        Countries.update({"code": "ST"}, {"dial_code": "+239"}, function() { console.log('country updated'); })
        Countries.update({"code": "SA"}, {"dial_code": "+966"}, function() { console.log('country updated'); })
        Countries.update({"code": "SN"}, {"dial_code": "+221"}, function() { console.log('country updated'); })
        Countries.update({"code": "RS"}, {"dial_code": "+381"}, function() { console.log('country updated'); })
        Countries.update({"code": "SC"}, {"dial_code": "+248"}, function() { console.log('country updated'); })

        Countries.update({"code": "SL"}, {"dial_code": "+232"}, function() { console.log('country updated'); })
        Countries.update({"code": "SG"}, {"dial_code": "+65"}, function() { console.log('country updated'); })
        Countries.update({"code": "SK"}, {"dial_code": "+421"}, function() { console.log('country updated'); })
        Countries.update({"code": "SI"}, {"dial_code": "+386"}, function() { console.log('country updated'); })
        Countries.update({"code": "SB"}, {"dial_code": "+677"}, function() { console.log('country updated'); })
        Countries.update({"code": "SO"}, {"dial_code": "+252"}, function() { console.log('country updated'); })
        Countries.update({"code": "ZA"}, {"dial_code": "+27"}, function() { console.log('country updated'); })
        Countries.update({"code": "GS"}, {"dial_code": "+500"}, function() { console.log('country updated'); })
        Countries.update({"code": "ES"}, {"dial_code": "+34"}, function() { console.log('country updated'); })
        Countries.update({"code": "LK"}, {"dial_code": "+94"}, function() { console.log('country updated'); })
        Countries.update({"code": "SD"}, {"dial_code": "+249"}, function() { console.log('country updated'); })
        Countries.update({"code": "SR"}, {"dial_code": "+597"}, function() { console.log('country updated'); })
        Countries.update({"code": "SJ"}, {"dial_code": "+47"}, function() { console.log('country updated'); })
        Countries.update({"code": "SZ"}, {"dial_code": "+268"}, function() { console.log('country updated'); })
        Countries.update({"code": "SE"}, {"dial_code": "+46"}, function() { console.log('country updated'); })
        Countries.update({"code": "CH"}, {"dial_code": "+41"}, function() { console.log('country updated'); })

        Countries.update({"code": "SY"}, {"dial_code": "+963"}, function() { console.log('country updated'); })
        Countries.update({"code": "TW"}, {"dial_code": "+886"}, function() { console.log('country updated'); })
        Countries.update({"code": "TJ"}, {"dial_code": "+992"}, function() { console.log('country updated'); })
        Countries.update({"code": "TZ"}, {"dial_code": "+255"}, function() { console.log('country updated'); })
        Countries.update({"code": "TH"}, {"dial_code": "+66"}, function() { console.log('country updated'); })
        Countries.update({"code": "TL"}, {"dial_code": "+670"}, function() { console.log('country updated'); })
        Countries.update({"code": "TG"}, {"dial_code": "+228"}, function() { console.log('country updated'); })
        Countries.update({"code": "TK"}, {"dial_code": "+690"}, function() { console.log('country updated'); })
        Countries.update({"code": "TO"}, {"dial_code": "+676"}, function() { console.log('country updated'); })
        Countries.update({"code": "TT"}, {"dial_code": "+1 868"}, function() { console.log('country updated'); })
        Countries.update({"code": "TN"}, {"dial_code": "+216"}, function() { console.log('country updated'); })
        Countries.update({"code": "TR"}, {"dial_code": "+90"}, function() { console.log('country updated'); })
        Countries.update({"code": "TM"}, {"dial_code": "+993"}, function() { console.log('country updated'); })
        Countries.update({"code": "TC"}, {"dial_code": "+1 649"}, function() { console.log('country updated'); })
        Countries.update({"code": "TV"}, {"dial_code": "+688"}, function() { console.log('country updated'); })
        Countries.update({"code": "UG"}, {"dial_code": "+256"}, function() { console.log('country updated'); })
        Countries.update({"code": "UA"}, {"dial_code": "+380"}, function() { console.log('country updated'); })
        Countries.update({"code": "AE"}, {"dial_code": "+971"}, function() { console.log('country updated'); })
        Countries.update({"code": "GB"}, {"dial_code": "+44"}, function() { console.log('country updated'); })
        Countries.update({"code": "US"}, {"dial_code": "+1"}, function() { console.log('country updated'); })
        Countries.update({"code": "UY"}, {"dial_code": "+598"}, function() { console.log('country updated'); })
        Countries.update({"code": "UZ"}, {"dial_code": "+998"}, function() { console.log('country updated'); })
        Countries.update({"code": "VU"}, {"dial_code": "+678"}, function() { console.log('country updated'); })
        Countries.update({"code": "VE"}, {"dial_code": "+58"}, function() { console.log('country updated'); })
        Countries.update({"code": "VN"}, {"dial_code": "+84"}, function() { console.log('country updated'); })
        Countries.update({"code": "VG"}, {"dial_code": "+1 284"}, function() { console.log('country updated'); })
        Countries.update({"code": "VI"}, {"dial_code": "+1 340"}, function() { console.log('country updated'); })
        Countries.update({"code": "WF"}, {"dial_code": "+681"}, function() { console.log('country updated'); })
        Countries.update({"code": "YE"}, {"dial_code": "+967"}, function() { console.log('country updated'); })
        Countries.update({"code": "ZM"}, {"dial_code": "+260"}, function() { console.log('country updated'); })
        Countries.update({"code": "ZW"}, {"dial_code": "+263"}, function() { console.log('country updated'); })
        Countries.update({"code": "UM"}, {"dial_code": "+246"}, function() { console.log('country updated'); })
        Countries.update({"code": "EH"}, {"dial_code": "+212"}, function() { console.log('country updated'); })
        Countries.update({"code": "BV"}, {"dial_code": "+47"}, function() { console.log('country updated'); })
        Countries.update({"code": "TF"}, {"dial_code": "+262"}, function() { console.log('country updated'); })
        Countries.update({"code": "HM"}, {"dial_code": "00 + 594"}, function() { console.log('country updated'); })
        Countries.update({"code": "XK"}, {"dial_code": "+383"}, function() { console.log('country updated'); })
      }
    );
  }
});
