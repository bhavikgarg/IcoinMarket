'use strict'

var mongoose = require('mongoose');
var co = require('co');
var request = require('co-request');
var config = require('./../server/config/environment');
var CryptoMarketData = require('./../server/api/cryptomarketdata/cryptomarket.model');
var cryptoCurrencyApiUrl = 'http://api.coinmarketcap.com/v1/ticker/?limit=';
var cryptoCurrencyChartApiUrl = 'https://graphs.coinmarketcap.com/currencies/';
var domain = 'https://coinmarketcap.com';
var topNCurrencyCount = 10;

var marketDataType = function (){
	return {
		'list': 'list',
		'detail': 'detail'
	}
}();

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});

var UpdateCryptoMarketData = function() {
var _self = this;

_self.execute = function(handleError) {
     co(function*() {
          try{
               var currentDate = new Date();
               var previousDate = new Date();
               previousDate.setDate(previousDate.getDate() -7);

               //get crypto currency data
               var options1 = {
                   url: cryptoCurrencyApiUrl + topNCurrencyCount,
                   headers: {'Content-Type': 'application/json'}
               };
               let currencyRequest = yield request.get(options1);
               var currencyList = JSON.parse(currencyRequest.body);
               if(currencyList) {
                   //update market data list
                     updateCryptoMarketDataList(currentDate, currencyList);

                   /*
                   //find and keep top 1 currency
                   var top1Data = currencyList.filter(function( obj ) {
                   return obj.rank === "1";
                   });
                   var currency = '';
                   if(top1Data && top1Data[0])
                   currency = top1Data[0].id; //eg: 'bitcoin'
                   */

                   //get top N crypto currency's 7 days detail data
                   currencyList.forEach(function(item){
                       var currency = item.id || ''; //eg: 'bitcoin'
                       updateCryptoMarketDataDetail(previousDate, currentDate, currency);
                   });

                   /*
                   currencyList.forEach(co(function* (item) {
                    // var data = yield db.collection.findOne({id: item.id}).exec();
                   }));
                   */

                   console.log('Crypto market data updated successfully : ' + currentDate);
               }
          }
          catch(e){
             console.log("UpdateCryptoMarketData Error: " + e);
             handleError(e);
          }
     }).catch(function(err) {
            console.log("UpdateCryptoMarketData Error: " + err);
            handleError(err);
     });
  }
  return {
    execute: _self.execute
  }
}

module.exports = UpdateCryptoMarketData;

//update crypto market list data
function updateCryptoMarketDataList(currentDate, currencyList) {
   try {
    //insert new record in db with current date and type
       var listData = new CryptoMarketData({
         currencyName: null,
         domain: domain,
         type: marketDataType.list,
         data: currencyList || null,
         fromDate: currentDate,
         tillDate: currentDate,
         active: true,
         createdDate: currentDate
       });
       CryptoMarketData.create(listData, function(err, response) {
           if (!err) {
             //delete all old record from db except new one based on type
               var deleteCondition1 = { type : marketDataType.list, '_id': { '$ne': response.id } };
               CryptoMarketData.remove(deleteCondition1, function(ierr, iresponse) {
                   if (ierr) {
                       console.log("Error in deleting crypto market list data old records. " + ierr);
                       return handleError(iresponse, ierr);
                   }
               });
               /*
               CryptoMarketData.findOneAndUpdate({query: deleteCondition1, sort: { createdDate: 1 }, remove: true}, function(err, response) {
                   if (err) {
                       return handleError(res, err);
                   }
                   else{ }
               });*/
           }
           else{
               console.log("Error in inserting crypto market list data" + err);
               return handleError(response, err);
           }
       });
   }
   catch(e) {
         console.log("Error in updateCryptoMarketDataList" + e);
         handleError(e);
   }
}

//update crypto market details data
function updateCryptoMarketDataDetail(previousDate, currentDate, currency){
  co(function*() {
        try {
           if(previousDate && currentDate && currency){
                var fromTime = previousDate.getTime();
                var tillTime = currentDate.getTime();

                var options2 = {
                   url:  cryptoCurrencyChartApiUrl + currency + '/' + fromTime + '/' + tillTime,
                   headers: {'Content-Type': 'application/json'}
                };

                let currencyDetailRequest = yield request.get(options2);
                var currencyDetail = JSON.parse(currencyDetailRequest.body);
                if(currencyDetail) {
                   //insert new record in db with current date, currency and type
                       var detailData = new CryptoMarketData({
                         currencyName: currency,
                         domain: domain,
                         type: marketDataType.detail,
                         data: currencyDetail || null,
                         fromDate: previousDate,
                         tillDate: currentDate,
                         active: true,
                         createdDate: currentDate
                       });
                       CryptoMarketData.create(detailData, function(err, response) {
                           if (!err) {
                             //delete all old record from db except new one based on type and currency
                               var deleteCondition2 = { type : marketDataType.detail, currencyName: {$eq: response.currencyName}, '_id': { '$ne': response.id } };
                               CryptoMarketData.remove(deleteCondition2, function(ierr, iresponse) {
                                   if (ierr) {
                                       console.log("Error in deleting crypto market detail data old records: " + ierr);
                                       return handleError(iresponse, ierr);
                                   }
                               });
                           }
                           else{
                               console.log("Error in inserting crypto market detail data: " + err);
                               return handleError(response, err);
                           }
                       });
                }
           }
        }
        catch(e){
             console.log("updateCryptoMarketDataDetail Error: " + e);
             handleError(e);
        }
   }).catch(function(err) {
       console.log("updateCryptoMarketDataDetail Error: " + err);
       handleError(err);
    });
}