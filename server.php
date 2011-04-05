#!/php -q
<?php  
// Run from command prompt > php -q websocket.demo.php

// Basic WebSocket demo echoes msg back to client
include "websocket.class.php";

/*
class GraphSocketServer extends WebSocket{
	function process($user, $msg){
		//parent->process($user, $msg);
	}
}
*/

$master = new WebSocket("amanda.local", 8080);