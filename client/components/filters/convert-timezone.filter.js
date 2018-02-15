angular.module('iCoinApp')
    .filter('convertTimeZone', function(){        
        return function(inputDate,timezone,userTimeZone){            
            var adminOffset = moment.tz(timezone).utcOffset(); // -240 for NY
            //var currentOffset = new Date().getadminOffset();
            var userOffset = moment.tz(userTimeZone).utcOffset(); // 330 for india
            var time = new Date(inputDate);
            //var dateWithOffset = new Date(time.getTime() + ((currentOffset + adminOffset) * 60 * 1000));
            var dateWithOffset = new Date(time.getTime() + ((adminOffset - userOffset) * 60 * 1000));
            var formattedDate =  moment(dateWithOffset).format('YYYY/MM/DD hh:mm:ss A');
            return formattedDate;
        }
    });