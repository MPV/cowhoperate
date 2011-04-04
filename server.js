var http = require('http'), 
	io = require('socket.io'),
	sys = require('sys');

server = http.createServer(function(req, res){ 
	// your normal server code
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end('<h1>Hello world</h1>'); 
});
server.listen(8080);
  
// socket.io 
var socket = io.listen(server); 
/*
socket.on('connection', function(client){ 
	// new client is here! 
	sys.log('Client connected.')
	
	client.on('message', function(){ 
		sys.log('Message from client...')
	}) 
	
	client.on('disconnect', function(){ 
		sys.log('Client disconnected.')
	}) 
}); 
*/
var buffer = [];
socket.on('connection', function(client){
    client.send({ buffer: buffer });
    client.broadcast({ announcement: client.sessionId + ' anslöt' });

    client.on('message', function(message){
        var msg = { message: [client.sessionId, message] };
        buffer.push(msg);
        if (buffer.length > 15) buffer.shift();
        client.broadcast(msg);
		sys.log(msg.message);
    });

    client.on('disconnect', function(){
        client.broadcast({ announcement: client.sessionId + ' kopplade från' });
    });
});