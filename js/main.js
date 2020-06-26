!(function(){
"use strict"
var width,height
var chartWidth, chartHeight
var margin
var svg = d3.select("#graph").append("svg")
var chartLayer = svg.append("g").classed("chartLayer", true)
main()

function main() {
	var range = 12
	var data = {
		nodes: d3.range(0, range).map(function(index){
			return {
				label: "node" + index,
						r:screen.width*0.015//~~d3.randomUniform(8, 28)()// Circles radio 
					}
				}),
		links: d3.range(0, range).map(function() {
			return {
						source:~~d3.randomUniform(range)(), // Random links assignments
						target:~~d3.randomUniform(range)() // Random links assignments
					}
				})
	}
	verifyAllNodesAreConnected(data, range)
	setSize(data)
	drawChart(data) 
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
	// .attr("stroke", "black")
	var node = svg.append("g")// nodes configuration
	.attr("class", "node")
	.selectAll("circle")
	.data(data.nodes)
	.enter().append("circle")
	.attr("r", function(d){  return d.r })
	.attr("label", function(d){  return d.label })
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
			// console.log("source: ", link.source, complement.csources.includes(link.source))
			complement.csources.splice( complement.csources.indexOf(link.source), 1)
		}
		if( complement.ctargets.includes(link.target) ){
			// console.log("target: ", link.target, complement.ctargets.includes(link.target))
			complement.ctargets.splice( complement.ctargets.indexOf(link.target), 1)
		}
	})
	// console.log('csources: ' +  complement.csources)
	// console.log('ctargets: ' +  complement.ctargets)
	// console.log(data.links)
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
	.attr('fill', 'orange')
	svg.append("text")
	.attr('id', 'text' + v.attr('label'))
	.attr('label', 'textNode' + v.attr('label'))
	.attr('x', function() { return d.x - 30 })
	.attr('y', function() { return d.y - 15 })
	.text(function() {
		return v.attr('label').charAt(0).toUpperCase() + v.attr('label').slice(1);
	})
}

function handleMouseOut(d, i) {
	let v = d3.select(this) // select node
	d3.select(this).attr('fill', '#8f1f96de')
	d3.select('#text' + v.attr('label')).remove(); // Remove text location
}
}());