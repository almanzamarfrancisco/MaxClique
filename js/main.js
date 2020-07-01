!(function(){
"use strict"
var width,height
var chartWidth, chartHeight
var margin
var svg = d3.select("#graph").append("svg")
var chartLayer = svg.append("g").classed("chartLayer", true)
var nodesColor = "#8f1f96de";
var nodesMouseOverFillColor = "#467fffc9";
var nodesMouseOverNeighborsFillColor = "#00afb7bf";
var cliqueColor = "#1dff02c7";
var globalData;
main()

function main() {
	var range = 12
	globalData = {
		nodes: d3.range(0, range).map(function(index){
			return {
				index: index,
				label: "node" + index,
						r:screen.width*0.025//~~d3.randomUniform(8, 28)()// Circles radio 
					}
				}),
		links: d3.range(0, range).map(function() {
			return {
						source:~~d3.randomUniform(range)(), // Random links assignments
						target:~~d3.randomUniform(range)() // Random links assignments
					}
				})
	}
	verifyAllNodesAreConnected(globalData, range)
	setSize(globalData)
	drawChart(globalData)
	getAllNodesNeighborhood(globalData) // Fill neighborhood second option - preload
	let R = [] // Response
	let X = [] // Auxiliar
	BronKerbosh(R, [...globalData.nodes], X)
}

function setSize(data) {
	width = document.querySelector("#graph").clientWidth
	height = document.querySelector("#graph").clientHeight

	margin = {top:0, left:0, bottom:0, right:0 }

	chartWidth = width - (margin.left+margin.right)
	chartHeight = height - (margin.top+margin.bottom)

	svg.attr("width", width).attr("height", height)

	chartLayer
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("transform", "translate("+[margin.left, margin.top]+")")
}
function drawChart(data) {
	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.index }))
		.force("collide",d3.forceCollide( function(d){return d.r + 8 }).iterations(16) )
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(chartWidth / 2, chartHeight / 2))
		.force("y", d3.forceY(0))
		.force("x", d3.forceX(0))
	var link = svg.append("g")
		.attr("class", "link")
		.selectAll("line")
		.data(data.links)
		.enter()
		.append("line")
		.attr("class", "link")
		.attr("id", function(d){ return "s" + d.source + "t" + d.target })
	var node = svg.append("g")
		.attr("class", "node")
		.selectAll("circle")
		.data(data.nodes)
		.enter().append("circle")
		.attr("r", function(d){  return d.r })
		.attr("label", function(d){  return d.label })
		.attr("id", function(d){  return d.label })
		.attr("index", function(d){  return d.index })
		.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended)
			)
		.on("mouseover", handleMouseOver)
		.on("mouseout", handleMouseOut)
	var ticked = function() {
		link
			.attr("x1", function(d) { return d.source.x })
			.attr("y1", function(d) { return d.source.y })
			.attr("x2", function(d) { return d.target.x })
			.attr("y2", function(d) { return d.target.y })

		node
			.attr("cx", function(d) { return d.x })
			.attr("cy", function(d) { return d.y })
	}  
	simulation
		.nodes(data.nodes)
		.on("tick", ticked)
	simulation.force("link")
		.links(data.links)  

	function dragstarted(d) {
		if (!d3.event.active) simulation.alphaTarget(0.3).restart()
			d.fx = d.x
		d.fy = d.y
	}

	function dragged(d) {
		d.fx = d3.event.x
		d.fy = d3.event.y
	}

	function dragended(d) {
		if (!d3.event.active) simulation.alphaTarget(0)
			d.fx = null
		d.fy = null
	} 
}
function verifyAllNodesAreConnected(data, range){
	let  complement = { // unadded items  complement used for verifying all nodes are connected
		csources: [...Array(range).keys()],// A container of all available numbers
		ctargets: [...Array(range).keys()],// A container of all available numbers
	}
	data.links.map(function(link, index){
		if( complement.csources.includes(link.source) ){
			complement.csources.splice( complement.csources.indexOf(link.source), 1)
		}
		if( complement.ctargets.includes(link.target) ){
			complement.ctargets.splice( complement.ctargets.indexOf(link.target), 1)
		}
	})
	complement.csources.map(function(source){
		data.links.push({
			source: source,
			target:~~d3.randomUniform(range)()
		})
	})
	complement.ctargets.map(function(target){
		data.links.push({
			source: ~~d3.randomUniform(range)(),
			target: target
		})
	})
}
// Create Event Handlers for mouse
function handleMouseOver(d, i) {
	let v = d3.select(this)
		.attr('fill', nodesMouseOverFillColor)
	showNodeLabelText(v.attr('label'))
	// fillNeighborhoodNodes(v.attr('index'), globalData, nodesMouseOverNeighborsFillColor); // first option
	fillNeighborhoodNodes(v.attr('index'), nodesMouseOverNeighborsFillColor) // Fill neighborhood second option
}
function handleMouseOut(d, i) {
	let v = d3.select(this) // select node
	d3.select(this).attr('fill', nodesColor)
	d3.select('#text' + v.attr('label')).remove() // Remove text location
	// fillNeighborhoodNodes(v.attr('index'), globalData, nodesColor); // Fill neighborhood first option
	fillNeighborhoodNodes(v.attr('index'), nodesColor) // second option
	d3.selectAll('.textNode').remove()
}
function getNeighborhoodLabels(nodeIndex, data){
	let nodeTargets = data.links.filter(function(link){
		return link.source.index == nodeIndex
	})
	let nodeSources = data.links.filter(function(link){
		return link.target.index == nodeIndex
	})
	return [
		...nodeTargets.map(function(node){ return node.target.label }),
		...nodeSources.map(function(node){ return node.source.label })
	]
}
/*function fillNeighborhoodNodes(nodeIndex, data, color){// Fill neighborhood first option - detonate to over
	let nodeNeighborsLabels = getNeighborhoodLabels(nodeIndex, data)
	// console.log(nodeNeighborsLabels)
	nodeNeighborsLabels.map(function(neighborLabel){
		d3.select('#' + neighborLabel)
			.attr('fill', color)
	})
}*/
function fillNeighborhoodNodes(nodeIndex, color){// Fill neighborhood second option - preloaded
	let v = d3.select('#node' + nodeIndex)
	let neighborhood = v.attr('neighborhood').split(',')
	if(neighborhood.length)
		neighborhood.map(function(neighborLabel){
			d3.select('#' + neighborLabel)
				.attr('fill', color)
			showNodeLabelText(neighborLabel)
		})
}
function getAllNodesNeighborhood(data){
	data.nodes.map(function(node){
		let labels = getNeighborhoodLabels(node.index, data)
		node.neighbors = labels.map(function(label){
			return parseInt(label.replace('node',''))
		});
		d3.select('#' + node.label)
			.attr('neighborhood', labels.toString())
	})
}
function showNodeLabelText(nodeLabel){
	let n = d3.select('#' + nodeLabel)
	svg.append("text") // Name label text
		.attr('id', 'text' + n.attr('label'))
		.attr('label', 'textNode' + n.attr('label'))
		.attr('class', 'textNode')
		.attr('x', function() { return n.attr('cx') - 15 })
		.attr('y', function() { return n.attr('cy') })
		.text(function() {
			return n.attr('label').charAt(0).toUpperCase() + n.attr('label').slice(1)
		})
}
function getNeighbors(index){
	return globalData.nodes[index].neighbors.map(function(nodeIndex){
		return globalData.nodes[nodeIndex]
	})
}
function intersection(A, B){
	if(!A.length || !B.length)
		return []
	let a = A.map(function(node){
		return node.index
	})
	let b = B.map(function(node){
		return node.index
	})
	let intersectionIndexes = a.filter(function(index){
		return b.includes(index)
	})
	return intersectionIndexes.map(function(index){
		return A[index]
	})
}
function fillNodes(R){
	console.log(R)
	if(!R)
		return
	R.map(function(node){
		d3.select('#node' + node.index)
			.attr('fill', cliqueColor)
	})
}
function BronKerbosh(R, P, X){
	if(P.length == X.length == 0){
		// console.log("As the maximal clique: ", R)
		fillNodes(R)
	}
	for(let n of P){
		let m = P.pop()
		if(!m)
			break
		// console.log('execute', m)
		R.push(m)
		P = intersection(P, getNeighbors(m.index))
		X = intersection(X, getNeighbors(m.index))
		// console.log(R)
		// console.log(P)
		// console.log(X)
		BronKerbosh(R, P, X)
		X = X.push(n)
	}
}
}());