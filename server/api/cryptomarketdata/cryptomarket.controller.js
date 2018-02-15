'use strict';

var request = require('request');
let co = require('co');
let coRequest = require('co-request');
var CryptoMarketData = require('./cryptomarket.model');
var config = require('../../config/environment');
var cryptoCurrencyApiUrl = 'http://api.coinmarketcap.com/v1/ticker/?limit=';
var cryptoCurrencyChartApiUrl = 'https://graphs.coinmarketcap.com/currencies/';
var howOldDataInMinute = 1;
var topNCurrencyCount = 10;
var marketDataType = function (){
	return {
		'list': 'list',
		'detail': 'detail'
	}
}();

module.exports = {
	getCryptoCurrencyData: function(req, res) {
	  var listData = {error : false, data: null, lastUpdatedOn : null};
	  co(function*() {
		try{
		        var limit = parseInt(req.params.limit) || topNCurrencyCount;
        		/*//get n minute older time
        		var cd = new Date();
        		cd.setSeconds(cd.getSeconds() - (howOldDataInMinute * 60));*/

        	  	var conditions = { type : marketDataType.list };
                var options = {
                    url: cryptoCurrencyApiUrl + limit,
                    headers: {'Content-Type': 'application/json'}
                };

        		//Find local data if available
        		CryptoMarketData.find(conditions).sort({createdDate: -1}).limit(1).exec(function(err, modelData) {
        	 		if(!err && modelData && modelData.length > 0){
        	 		    var localData = modelData[0];
        			    listData.data = localData.data;
        			    listData.lastUpdatedOn = localData.createdDate;
                        return res.status(200).json(listData);

                        /*
        		      	if (limit === topNCurrencyCount && (localData.createdDate === cd || localData.createdDate > cd) ) {
        		      	     return res.status(200).json(listData);
        		      	}
        		      	else{
                        	//fetch live data
                            request.get(options, function(error, response, currencyList) {
                                if(!err && response.statusCode === 200){
                                    listData.data = JSON.parse(currencyList);
                                    listData.lastUpdatedOn = new Date();
                                    return res.status(200).json(listData);
                                }
                                else {
                                   if(listData.data && listData.data.length > 0)
                                   {
                                        return res.status(200).json(listData);
                                   }
                                   else {
                                        listData.data  = 'Error in getting coin data from cryptocoinmarketcap.com';
                                        listData.error = true;
                                        return res.status(200).json(listData);
                                   }
                                }
                            });
        		      	}
        		      	*/
        	    	}
        	    	else {
        	      		//fetch live data
        	      		request.get(options, function(error, response, currencyList) {
                            if(!err && response && response.statusCode === 200){
                                listData.data = JSON.parse(currencyList);
                                listData.lastUpdatedOn = new Date();
                                return res.status(200).json(listData);                                                                                         
                            }
                            else {
                                listData.data  = 'Error in getting coin data from cryptocoinmarketcap.com';
                                listData.error = true;
                                return res.status(500).json(listData);
                            }
                        });
        	      	}
          		});
		}
		catch(e){
           if(listData.data && listData.data.length > 0)
           {
                return res.status(200).json(listData);
           }
           else {
                listData.data  = 'Error in getting coin data from cryptocoinmarketcap.com';
                listData.error = true;
                return res.status(500).json(listData);
           }
		}
     }).catch(function(err) {
          //return res.status(500).json({ error: true, data: 'Error in getting chart data: ' + err });
         if(listData.data && listData.data.length > 0)
         {
              return res.status(200).json(listData);
         }
         else {
              listData.data  = 'Error in getting coin data from cryptocoinmarketcap.com';
              listData.error = true;
              return res.status(500).json(listData);
         }
     });
	},

	getCryptoCurrencyChartData: function(req, res) {
	  var detailData = {error : false, data: null, lastUpdatedOn : null};
      co(function*() {
        try{
            var currency =  req.query.currency, currentDate, previousDate;
            if(currency === null || currency === '')
            {
             detailData.data  = 'Please provide currency to get the data';
             detailData.error = true;
             return res.status(500).json(detailData);
            }
            if(req.query.starttime && req.query.endtime) {
               currentDate = new Date(parseInt(req.query.endtime));
               previousDate = new Date(parseInt(req.query.starttime));
            }
            else{
                //get 7 days old date
                currentDate = new Date();
                previousDate = new Date();
                previousDate.setDate(previousDate.getDate() -7);
            }
            var fromTime = previousDate.getTime();
            var tillTime = currentDate.getTime();
            /*//get n minute older time
        		var cd = new Date();
        		cd.setSeconds(cd.getSeconds() - (howOldDataInMinute * 60));*/

            var conditions = { type : marketDataType.detail, currencyName: currency };
            var options = {
                    url:  cryptoCurrencyChartApiUrl + currency + '/' + fromTime + '/' + tillTime,
                    headers: { 'Content-Type': 'application/json' }
                };

            //Find local data if available
            CryptoMarketData.find(conditions).sort({createdDate: -1}).limit(1).exec(function(err, modelData) {
                if(!err && modelData && modelData.length > 0){
                 var localData = modelData[0];
                    detailData.data = localData.data;
                    detailData.lastUpdatedOn = localData.createdDate;
                    //(localData.createdDate === cd || localData.createdDate > cd ) &&
                   if ((localData.fromDate.toDateString() == previousDate.toDateString()) && (localData.tillDate.toDateString() == currentDate.toDateString()))
                   {
                          return res.status(200).json(detailData);
                   }
                    else {
                        //fetch live data
                        request.get(options, function(error, response, currencyDetail) {
                            if(!err && response &&  response.statusCode === 200){
                                detailData.data = JSON.parse(currencyDetail);
                                detailData.lastUpdatedOn = new Date();
                                return res.status(200).json(detailData);
                            }
                            else {
                               if(detailData.data && detailData.data.length > 0)
                               {
                                    return res.status(200).json(detailData);
                               }
                               else {
                                    detailData.data  = 'Error in getting coin data from cryptocoinmarketcap.com';
                                    detailData.error = true;
                                    return res.status(200).json(detailData);
                               }
                            }
                        });
                   }
                }
                else {
                    //fetch live data
                    request.get(options, function(error, response, currencyDetail) {
                        if(!err && response && response.statusCode === 200){
                            detailData.data = JSON.parse(currencyDetail);
                            detailData.lastUpdatedOn = new Date();
                            return res.status(200).json(detailData);
                        }
                        else {
                            detailData.data  = 'Error in getting coin detail data from cryptocoinmarketcap.com';
                            detailData.error = true;
                            return res.status(500).json(detailData);
                        }
                    });
                }
            });
  	    }
        catch(e){
           if(detailData.data && detailData.data.length > 0)
           {
                return res.status(200).json(detailData);
           }
           else {
                detailData.data  = 'Error in getting coin data from cryptocoinmarketcap.com';
                detailData.error = true;
                return res.status(500).json(detailData);
           }
        }
      }).catch(function(err) {
         if(detailData.data && detailData.data.length > 0)
         {
              return res.status(200).json(detailData);
         }
         else {
              detailData.data  = 'Error in getting coin data from cryptocoinmarketcap.com';
              detailData.error = true;
              return res.status(500).json(detailData);
         }
      });
	}
};