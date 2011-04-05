var Renderer = function(canvas) {
	var canvas = $(canvas).get(0);
	var ctx = canvas.getContext("2d");
	var gfx = arbor.Graphics(canvas);
	var particleSystem;
	
	// helpers for figuring out where to draw arrows (thanks springy.js)
	var intersect_line_line = function(p1, p2, p3, p4)
	{
		var denom = ((p4.y - p3.y)*(p2.x - p1.x) - (p4.x - p3.x)*(p2.y - p1.y));
		if (denom === 0) return false; // lines are parallel
		var ua = ((p4.x - p3.x)*(p1.y - p3.y) - (p4.y - p3.y)*(p1.x - p3.x)) / denom;
		var ub = ((p2.x - p1.x)*(p1.y - p3.y) - (p2.y - p1.y)*(p1.x - p3.x)) / denom;
	
		if (ua < 0 || ua > 1 || ub < 0 || ub > 1)  return false;
		return arbor.Point(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
	}
	
	var intersect_line_box = function(p1, p2, boxTuple)
	{
	  var p3 = {x:boxTuple[0], y:boxTuple[1]},
		  w = boxTuple[2],
		  h = boxTuple[3];
	
		var tl = {x: p3.x, y: p3.y};
		var tr = {x: p3.x + w, y: p3.y};
		var bl = {x: p3.x, y: p3.y + h};
		var br = {x: p3.x + w, y: p3.y + h};
	
	  return intersect_line_line(p1, p2, tl, tr) ||
			 intersect_line_line(p1, p2, tr, br) ||
			 intersect_line_line(p1, p2, br, bl) ||
			 intersect_line_line(p1, p2, bl, tl) ||
			 false;
	};
	
	var that = {
		init: function(system) {
			//
			// the particle system will call the init function once, right before the
			// first frame is to be drawn. it's a good place to set up the canvas and
			// to pass the canvas size to the particle system
			//
			// save a reference to the particle system for use in the .redraw() loop
			particleSystem = system;

			// inform the system of the screen dimensions so it can map coords for us.
			// if the canvas is ever resized, screenSize should be called again with
			// the new dimensions
			particleSystem.screenSize(canvas.width, canvas.height);
			particleSystem.screenPadding(20); // leave an extra x px of whitespace per side
			// set up some event handlers to allow for node-dragging
			//that.initMouseHandling()
		},

		redraw: function() {
			if (!particleSystem) return;
			// 
			// redraw will be called repeatedly during the run whenever the node positions
			// change. the new positions for the nodes can be accessed by looking at the
			// .p attribute of a given node. however the p.x & p.y values are in the coordinates
			// of the particle system rather than the screen. you can either map them to
			// the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
			// which allow you to step through the actual node objects but also pass an
			// x,y point in the screen's coordinate system
			// 
			//ctx.fillStyle = "white";
			//ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.clearRect(0,0, canvas.width, canvas.height);
			
			var nodeBoxes = {};
			particleSystem.eachNode(function(node, pt) {
				/*
				// node: {mass:#, p:{x,y}, name:"", data:{}}
				// pt:	 {x:#, y:#}	node position in screen coords
				// draw a rectangle centered at pt
				var w = 10;
				ctx.fillStyle = (node.data.alone) ? "orange" : "black";
				ctx.fillRect(pt.x - w / 2, pt.y - w / 2, w, w);
				var nameSize = ctx.measureText(node.name);
				ctx.fillText(node.name, pt.x - nameSize.width/2, pt.y - w / 2 - 5);*/
				
				// determine the box size and round off the coords if we'll be 
				// drawing a text label (awful alignment jitter otherwise...)
				var label = node.name||"";//node.data.label||""
				var w = ctx.measureText(""+label).width + 10
				if (!(""+label).match(/^[ \t]*$/)){
				  pt.x = Math.floor(pt.x)
				  pt.y = Math.floor(pt.y)
				}else{
				  label = null
				}
				
				// draw a rectangle centered at pt
				if (node.data.color) ctx.fillStyle = node.data.color
				// else ctx.fillStyle = "#d0d0d0"
				else ctx.fillStyle = "rgba(0,0,0,.7)"
				if (node.data.color=='none') ctx.fillStyle = "white"
				
				if (node.data.shape=='dot'){
				   gfx.oval(pt.x-w/2, pt.y-w/2, w,w, {fill:ctx.fillStyle})
				   nodeBoxes[node.name] = [pt.x-w/2, pt.y-w/2, w,w]
				}else{
				  gfx.rect(pt.x-w/2, pt.y-10, w,20, 4, {fill:ctx.fillStyle})
				  nodeBoxes[node.name] = [pt.x-w/2, pt.y-11, w, 22]
				}
				
				// draw the text
				if (label){
				  ctx.font = "12px Helvetica"
				  ctx.textAlign = "center"
				  ctx.fillStyle = "white"
				  if (node.data.color=='none') ctx.fillStyle = '#333333'
				  ctx.fillText(label||"", pt.x, pt.y+4)
				  ctx.fillText(label||"", pt.x, pt.y+4)
				}
			});
			
			ctx.strokeStyle = "#cccccc"
			ctx.lineWidth = 1
			ctx.beginPath()
			particleSystem.eachEdge(function(edge, pt1, pt2){
				// edge: {source:Node, target:Node, length:#, data:{}}
				// pt1:  {x:#, y:#}  source position in screen coords
				// pt2:  {x:#, y:#}  target position in screen coords
				
				var weight = edge.data.weight
				var color = edge.data.color
				
				// trace(color)
				if (!color || (""+color).match(/^[ \t]*$/)) color = null
				
				// find the start point
				var tail = intersect_line_box(pt1, pt2, nodeBoxes[edge.source.name])
				var head = intersect_line_box(tail, pt2, nodeBoxes[edge.target.name])
				
				ctx.save() 
				ctx.beginPath()
				
				if (!isNaN(weight)) ctx.lineWidth = weight
				if (color) ctx.strokeStyle = color
				// if (color) trace(color)
				ctx.fillStyle = null
				
				ctx.moveTo(tail.x, tail.y)
				ctx.lineTo(head.x, head.y)
				ctx.stroke()
				ctx.restore()
				
				// draw an arrowhead if this is a -> style edge
				if (edge.data.directed){
					ctx.save()
					// move to the head position of the edge we just drew
					var wt = !isNaN(weight) ? parseFloat(weight) : ctx.lineWidth
					var arrowLength = 6 + wt
					var arrowWidth = 2 + wt
					ctx.fillStyle = (color) ? color : ctx.strokeStyle
					ctx.translate(head.x, head.y);
					ctx.rotate(Math.atan2(head.y - tail.y, head.x - tail.x));
					
					// delete some of the edge that's already there (so the point isn't hidden)
					ctx.clearRect(-arrowLength/2,-wt/2, arrowLength/2,wt)
					
					// draw the chevron
					ctx.beginPath();
					ctx.moveTo(-arrowLength, arrowWidth);
					ctx.lineTo(0, 0);
					ctx.lineTo(-arrowLength, -arrowWidth);
					ctx.lineTo(-arrowLength * 0.8, -0);
					ctx.closePath();
					ctx.fill();
					ctx.restore()
				}
			})
		}
	};
	return that;
}