// Declare the particle system:
var sys;
var nodes = [];
var edges = [];
var allNodes = [];
var allEdges = [];
var myNodes = [];
var myEdges = [];
var socket;
var myName = 'Du';

(function($) {

	$(document).ready(function() {
		
		handleFormModification();
		
		// Get the users name from the URL: 
		var name = getParameterByName('name');
		if(name){
			myName = name;
		}
		
		if (Modernizr.canvas) {
			
			$('#connection_graph').append('<canvas id="viewport" width="' + window.screen.availWidth + '" height="' + window.screen.availHeight + '"></canvas>');
			//document.write('<script src="js/jquery-ui-1.8.10.min.js">\x3C/script>');
			
			// Using Arbor.js	http://arborjs.org/reference
			sys = arbor.ParticleSystem(1000, 600, 0.5); // create the system with sensible repulsion/stiffness/friction
			sys.parameters({
				gravity: true
			}); // use center-gravity to make the graph settle nicely (ymmv)
			sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...
		}
		
		handleSocketIO();
		
		$('form').submit(function(){
			/*nodes = [];
			sys.eachNode(function(node, pt){
				nodes.push(node);
			});
			*/
			edges = [];
			sys.eachEdge(function(edge, pt1, pt2){
				edges.push(edge);
			});
			
			socket.send({
				//nodes: nodes, 
				edges: edges
			});
			
			return false;
		});
	});
	
	/**
	 *
	 */
	function updateConnections(e){
		var previousName = $(e.target).data('previous') || '';
		var newName = e.target.value;
		var previousNode;
		
		// Don't allow nodes with empty names:
		if(newName == ""){
			return false;
		}
		
		// Don't do anything if nothing has changed:
		if(newName == previousName){
			return false;
		}
		
		// Keep myNodes and myEdges variables up to date:
		myEdges = [];
		myNodes = [];
		$('#connections input[type="text"]').each(function(index, element){
			/*
			node = sys.getNode("" + element.value);
			//if(node){
				myNodes.push(node);
			//	myNodes.push(element.value)
			//}
			*/
			edge = sys.getEdges(myName, element.value);
			myEdges.push(edge);
		});
		
		// Did this input field have a node already? Just change it instead of creating a new one:
		if(previousName){
			sys.eachNode(function(node, pt){
				if(node.name == previousName){
					previousNode = node;
				}
			});
			//var previousNode = sys.getNode(previousName);
			// Does a node with the new name already exist? Remove that node then:
			var newNode = sys.getNode(newName);
			if(typeof newNode != 'undefined'){
				sys.pruneNode(previousNode);
				sys.addEdge(myName, newNode, {
					directed: true, 
					weight: 3
				});
			}
			
			if(typeof previousNode != 'undefined'){
				previousNode.name = newName;
				sys.renderer.redraw();
			}
		}
		else{
			sys.addNode(newName, {
				color: 'rgba(0,0,0,.5)'
			});
			sys.addEdge(myName, newName, {
				directed: true, 
				weight: 3
			});
		}
		
		// Remove broken nodes (so we don't show nodes)
		sys.eachNode(function(node, pt){
			if(node.name == ""){
				sys.pruneNode(node);
			}
		});
		
		// Save new name as previous name (for next change):
		$(e.target).data('previous', newName);
		
		sys.renderer.redraw();
	}

	/**
	 * Returns a random integer between min and max
	 * Using Math.round() will give you a non-uniform distribution!
	 * @author http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript
	 */
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	/**
	 *	http://stackoverflow.com/questions/901115/get-querystring-values-in-javascript/5158301#5158301
	 */
	function getParameterByName(name) {
		var match = RegExp('[?&]' + name + '=([^&]*)')
	                    .exec(window.location.search);
		return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
	}
	
	function log(message){
		//if(typeof console == 'object'){
		//	console.log(message)
		//}
		$('#status').append(message + '<br/>');
	}
	
	function addEdgesAndNodesFromMemory(){
		// Remove old:
		/*
		sys.eachNode(function(node, pt){
			sys.pruneNode(node);
		});
		sys.eachEdge(function(edge, pt1, pt2){
			sys.pruneEdge(edge);
		});
		*/
		
		// Add new:
		$.each(nodes, function(index, element){
			sys.addNode(element.name, {
				color: 'rgba(0,0,0,.5)'
			});
		});
		
		$.each(edges, function(index, element){
			edgeFound = sys.getEdges(element.source.name, element.target.name);
			if(edgeFound.length == 0){
				sys.addEdge(element.source.name, element.target.name, {
					directed: true, 
					weight: 3
				});
			}
		});
		
		me = sys.getNode(myName);
		if(me){
			me.data.color = 'green';
			sys.renderer.redraw();
		}
	}
	
	function handleSocketIO(){
		socket = new io.Socket("amanda.local", {
			port: 8080
		});
		socket.connect();
		socket.on('connect', function(){
			log('Du &auml;r ansluten!')
		});
		socket.on('message', function(message){
			if(message.announcement){
				console.log(/*'Announcement: ' + */message.announcement)
			}
			else if(message.message){
				log('Meddelande: ' + message.message[1])
			}
			else if(message.buffer){
				$.each(message.buffer, function(index, element){
					log('Historik: ' + element.message[1])
				});
			}
			
			if(message.nodes){
				nodes = message.nodes;
				addEdgesAndNodesFromMemory();
			}
			if(message.edges){
				edges = message.edges;
				addEdgesAndNodesFromMemory();
			}
			log('Tog emot data från servern...');
			console.log(message)
		});
		socket.on('disconnect', function(){
			console.log('Du kopplades fr&aring;n.')
		});
	}
	
	function handleFormModification(){
		$('.connection .add').live('click', function() {

			var this_connection = $(this).parent().parent();
			var new_connection = this_connection.clone(false);

			if (new_connection) {
				// Make sure all selects are selected as in previous connection:
				var this_selects = this_connection.find('select');
				new_connection.find('select').each(function(index, item) {
					$(item).val(this_selects.eq(index).val());
				});

				// Clear the name field:
				new_connection.find('input[type="text"]').val('');

				// Add a new connection field:
				new_connection.insertAfter($(this).parent().parent());

				// Focus the just added select box:
				this_connection.next('.connection').find('select').focus();
			}
			
			return false;
		});

		$('.connection .remove').live('click', function() {
			
			var nodeName = $(this).parent().parent('.connection').find('input[type="text"]').val();
			var previousName = $(this).parent().parent('.connection').find('input[type="text"]').data('previous')
			
			// Remove the entire connection field:
			$(this).parent().parent('.connection').remove();
			
			// Remove all tipsys (bug in tipsy):
			$('.tipsy').remove();
			
			// Update the graph:
			//updateConnections();
			//sys.pruneNode(sys.getNode(nodeName));
			sys.eachNode(function(node, pt){
				if(node.name == nodeName || node.name == previousName){
					sys.pruneNode(node);
				}
			});
			
			return false;
		});
		
		$('.connection .add').tipsy({
			delayIn: 1000,
			gravity: 's',
			live: true
		});
		
		$('.connection .remove').tipsy({
			delayIn: 1000,
			gravity: 's',
			live: true
		});
		
		// Update the graph when text values change:
		$('#connections input[type="text"]').live('keyup', updateConnections);
		$('#connections input[type="text"]').live('blur', updateConnections);
		
		// Contacts, static for now, dynamic later...
		var contactNames = ['Jonas', 'Pelle', 'Anders', 'Victor', 'Mikael', 'Fredrik', 'Maxim'];
		// Sort names alphabetically:
		contactNames.sort();
		
		// Autocomplete contacts, using jQuery UI autocomplete:
		// http://jqueryui.com/demos/autocomplete/
		$('.connection .contact input').live('keyup.autocomplete', function(){
			$(this).autocomplete({
				delay: 0,
				source: contactNames
			});
		});
	}

})(this.jQuery);