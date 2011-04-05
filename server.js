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

var nodes = [
	{name: "Ludde"},
	{name: "Nisse"},
	{name: "Pelle"},
	{name: "Ola"}
];
var edges = [
/*
	{
		source: {
			name: "Du"
		}, 
		target: {
			name: "Nisse"
		}, 
	}
*/
];

//var buffer = [];
socket.on('connection', function(client){
    
	client.send({ 
		//buffer: buffer, 
		nodes: nodes, 
		edges: edges
	});
	
    client.broadcast({ announcement: 'Någon anslöt.'});//' (' + client.sessionId + ')' });

    client.on('message', function(message){
		//var msg = {
		//	message: [
		//		client.sessionId, 
		//		message
		//	] 
		//};
		
		if(/*message.nodes || */message.edges){
			/*if(message.nodes){
				nodes = message.nodes;
			}*/
			if(message.edges){
				edges = message.edges;
			}
			msg = {
				//nodes: nodes, 
				edges: edges
			};
		}
		//else{
		//	buffer.push(msg);
	    //    if (buffer.length > 15) buffer.shift();
		//	sys.log(msg.message);
		//}
        client.broadcast(msg);
    });

    client.on('disconnect', function(){
        client.broadcast({ announcement: 'Någon kopplade från.'});// (' + client.sessionId + ')' });
    });

});