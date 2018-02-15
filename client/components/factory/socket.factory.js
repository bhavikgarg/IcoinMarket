angular.module('iCoinApp')
.factory('socket', function (socketFactory, ApiPath) {
        // return socketFactory();
        var socket = io.connect(ApiPath, {transports: ['websocket']});
        var mySocket = socketFactory({ioSocket: socket});
        mySocket.forward('notification');
        return mySocket;
    });