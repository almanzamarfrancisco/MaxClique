!(function(){
	"use strict"
	var width, height
	var chartWidth, chartHeight
	var margin
	var svg = d3.select("#graph").append("svg")
	var chartLayer = svg.append("g").classed("chartLayer", true)
	var nodesColor = "#8f1f96de";
	var nodesMouseOverFillColor = "#467fffc9";
	var nodesMouseOverNeighborsFillColor = "#00afb7bf";
	var cliqueColor = "#1dff02c7";
	var globalData;
	var call = 0 //Calling counter
	var foundCliques = []
	var range = 5
	const maxAllowedSize = 5 * 1024 * 1024;
	var loadedGraphFound = false 
	var nodeRadius = screen.width*0.01
	var neighborhoodLengths = []
	const arrayRange = (start, stop, step) => Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));
	main()

	function main() {
		let localStorageRange = localStorage.getItem('range')
		range =  localStorageRange || range
		var loadedGraph = localStorage.getItem('loadedGraph')
		if(loadedGraph){
			console.log('Graph found')
			loadedGraphFound = true
			globalData = JSON.parse(loadedGraph)
			globalData.nodes.map(function(node){
				if(!node.r)
					node.r = nodeRadius
			})
			range = globalData.nodes.length
			console.log("Number of nodes: " + range)
			globalData.links = globalData.links.filter(function(link){
				return link.source < range && link.target < range
			})
			// console.log(globalData)
		}
		else
			globalData = {// Place random set
				nodes: d3.range(0, range).map(function(index){// Place nodes
					return {
						index: index,
						label: "node" + index,
								r: nodeRadius//~~d3.randomUniform(8, 28)()// Circles radio 
							}
						}),
				links: d3.range(0, range).map(function() {// Place random link
					return {
								source:~~d3.randomUniform(range)(), // Random links assignments
								target:~~d3.randomUniform(range)() // Random links assignments
							}
						})
			}
		document.querySelector("#numberOfNodes").value = range
		if(!loadedGraphFound)
			verifyAllNodesAreConnected(range)
		setSize()
		drawChart()
		getAllNodesNeighborhood() // Fill neighborhood
		let R = [] // Response
		let X = [] // Auxiliar
		// BronKerbosh(R, [...globalData.nodes], X)
		IK_(R, [...globalData.nodes], X)
		console.log(foundCliques)
		fillMaximalClique()
		document.querySelector("#dowloadActualGraphButton").// Dowload button
			addEventListener('click', function(){dowloadJSONData(globalData, "actualGraph.json")}, false)
		document.querySelector("#loadFile").// Dowload button
			addEventListener('change', function(){ getFileContent() }, false)
		// let t = arrayRange(200, 500,1)
		// console.log(t.map(value => {return { "index": value, "label": "node" + value }}))
	}

	function verifyAllNodesAreConnected(range){
		globalData.links = globalData.links.filter((link) => { // For delete links which are from a node to the same
			return link.source !== link.target
		})
		let  complement = { // unadded items  complement used for verifying all nodes are connected
			csources: arrayRange(0, range-1, 1),// A container of all available numbers
			ctargets: arrayRange(0, range-1, 1),// A container of all available numbers
		}
		let sources = globalData.links.map(function(link){
			return link.source
		})
		let targets = globalData.links.map(function(link){
			return link.target
		})
		sources.map(function(index){complement.csources.splice(index, 1)})
		targets.map(function(index){complement.ctargets.splice(index, 1)})
		complement.csources.map(function(source){
			globalData.links.push({
				source: source,
				target:~~d3.randomUniform(range)()
			})
		})
		complement.ctargets.map(function(target){
			globalData.links.push({
				source: ~~d3.randomUniform(range)(),
				target: target
			})
		})
		globalData.links = globalData.links.filter((link) => { // For delete links which are from a node to the same
			return link.source !== link.target
		})
		globalData.links = [...new Set(globalData.links.flat(1))] // For getting uniques arrays 
	}
	function setSize() {
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
	function drawChart() {
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
			.data(globalData.links)
			.enter()
			.append("line")
			.attr("class", "link")
			.attr("id", function(d){ return "s" + d.source + "t" + d.target })
		var node = svg.append("g")
			.attr("class", "node")
			.selectAll("circle")
			.data(globalData.nodes)
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
		try {
			simulation
				.nodes(globalData.nodes)
				.on("tick", ticked)
			simulation
				.force("link")
				.links(globalData.links)
		} catch(e) {
			console.log(e);
		}

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
			if (!d3.event.active)
				simulation.alphaTarget(0)
			d.fx = null
			d.fy = null
		}
	}
	// Create Event Handlers for mouse
	function handleMouseOver(d, i) {
		let v = d3.select(this)
		if(!v.attr('clique-part'))
			v.attr('fill', nodesMouseOverFillColor)
		showNodeLabelText(v.attr('label'))
		fillNeighborhoodNodes(v.attr('index'), nodesMouseOverNeighborsFillColor) // Fill neighborhood second option
	}
	function handleMouseOut(d, i) {
		let v = d3.select(this) // select node
		if(!v.attr('clique-part'))
			v.attr('fill', nodesColor)
		d3.select('#text' + v.attr('label')).remove() // Remove text location
		fillNeighborhoodNodes(v.attr('index'), nodesColor) // second option
		d3.selectAll('.textNode').remove()
	}
	//
	function getAllNodesNeighborhood(){
		globalData.nodes.map(function(node){
			node.neighbors = getNeighborhoodLabels(node.index)
			neighborhoodLengths.push(node.neighbors.length)
			d3.select('#' + node.label)
				.attr('neighborhood', node.neighbors.toString())
		})
	}
	function getNeighborhoodLabels(nodeIndex){
		let neighborsIndex = []
		globalData.links.map(function(link){
			if(link.source.index === nodeIndex && !neighborsIndex.includes(link.target.index))
				neighborsIndex.push(link.target.index)
			if(link.target.index === nodeIndex && !neighborsIndex.includes(link.source.index))
				neighborsIndex.push(link.source.index)
		})
		return neighborsIndex.map(function(index){ return "node" + index} )
	}
	function fillNeighborhoodNodes(nodeIndex, color){// Fill neighborhood 
		let v = d3.select('#node' + nodeIndex)
		let neighborhood = v.attr('neighborhood').split(',')
		if(neighborhood.length)
			neighborhood.map(function(neighborLabel){
				let node = d3.select('#' + neighborLabel)
				if(!node.attr('clique-part'))
					node.attr('fill', color)
				showNodeLabelText(neighborLabel)
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
		.style('font-size', nodeRadius*0.5)
		.text(function() {
			return n.attr('label').charAt(0).toUpperCase() + n.attr('label').slice(1)
		})
	}
	function getNeighbors(index){
		return globalData.nodes[index].neighbors.map(function(nodeLabel){
			return globalData.nodes[parseInt(nodeLabel.replace('node', ''))]
		})
	}
	function intersection(A, B){
		if(!A || !B || !A.length || !B.length)
			return []
		// console.log(A, B)
		let a = A.map(function(node){
			return node.index
		})
		let b = B.map(function(node){
			return node.index
		})
		let intersectionIndexes = a.filter(function(index){
			return b.includes(index)
		})
		let result = intersectionIndexes.map(function(index){
			return globalData.nodes[index]
		})
		// console.log(result)
		return result
	}
	function fillNodes(R, color = cliqueColor){
		// console.log(R, color)
		if(!R)
			return
		R.map(function(node){
			d3.select('#node' + node.index)
			.attr('fill', color)
			.attr('clique-part',true)
		})
	}
	function dropElement(G, n){
		return G.filter(function(node){
			return node.index !== n.index
		})
	}
	function BronKerbosh(R, P, X){
		call++// calling counter
		if(P.length === 0 && X.length === 0){
			if(R.length > 2){
				// console.log("As the maximal clique: ", R)
				fillNodes(R)
				foundCliques.push(R)
			}
		}
		else
			for(let n of P){
				P = dropElement(P, n)
				let r = [...R, n]
				let neighbors = getNeighbors(n.index)
				let p = intersection([...P], neighbors)
				let x = intersection([...X], neighbors)
				BronKerbosh(r, p, x)
				X = [...X, n]
			}
	}
	function IK_(R, P, X){
		call++
		if(P.length === 0 && X.length === 0){
			if(R.length > 2){
				// console.log("As the maximal clique: ", R)
				fillNodes(R)
				foundCliques.push(R)
			}	
		}
		else{
			if(!P.length)
				return	
			let pivot
			if(call === 1)
				pivot = P[neighborhoodLengths.indexOf(Math.max(...neighborhoodLengths))]
			let choosepivotArray = P.map(function(node){
				return node.neighbors.length
			})
			pivot = P[choosepivotArray.indexOf(Math.max(...choosepivotArray))]// Choose pivot
			let pivotNeighborhood = getNeighbors(pivot.index)
			let pivotNeighborhoodIndexes = pivotNeighborhood.map(function(node){
				return node.index
			})
			for(let n of P){
				if(!pivotNeighborhoodIndexes.includes(n.index)){
					P = dropElement(P, n)
					let r = [...R, n]
					let neighbors = getNeighbors(n.index)
					let p = intersection([...P], neighbors)
					let x = intersection([...X], neighbors)
					IK_(r, p, x)
					X = [...X, n]
				}
			}

		}
	}

	//funcion de simulacion de templado
	function SimulatedAnnealing(){
		//establecer temperaturas y constante de enfriamiento, es como las condiciones de un for
		//temperatura_ini, temperatura_fin, n, c son variables de entrada, podriamos definirlas en funcion del tamaño
		//del grafo
		let temperatura_ini=50
		let temperatura_fin=10
		//constante de enfriamiento
		//entre mas chico menos iteraciones, menos preciso
		//entre mas grande mas itereaciones, mas preciso pero tambien mas tardado
		let c=.5
		//numero de movimientos
		let n=500
		let t_sistema=temperatura_ini
		//=========================el muestreo es lo que no me sale================================
		let x =muestreo()
		//energia= al numero de vertices interconectados ie, numero de elementos del clique encontrado
		let e//encontrar clique y contar nodos de x
		while (t_sistema>temperatura_fin) {
			for (let i = 1; i < n; i++) {
				//x_prima es el vecindario de un nodo de la vecindad del nodo de muestreo
				//x_prima tambien es una solucion porque en todo subgrafo hay al menos un clique de 2 pero 
				//esa evaluacion se toma mas adelante
				//aqui necesitamos una funcion que obtenga ese vecindario 
				let x_prima
				//e_prima es el conteo de nodos que el clique maximo de x prima tiene
				let e_prima 
				if (e_prima>e) {
					x=x_prima
					e=e_prima
				} else {
					//distribucion uniforme entre 0 y 1
					let r=Math.random()
					//constante para definir la aleatoriedad y el avance hacia el maximo global
					let exp=Math.exp(-(e-e_prima))
					if (r<exp) {
						x=x_prima
						e=e_prima
					}
				}
				//enfriamiento del sistema para finalizar el ciclo while en algun punto
				t=c*t	
			}
		}
		//regresa la solucion encontrada al final del enfriamiento del sistema
		return x
	}


	function fillMaximalClique(){
		let maximalClique = []
		foundCliques.map(function(clique){
			if(clique.length > maximalClique.length)
				maximalClique = clique
		})
		fillNodes(maximalClique, '#08e5fdb5')
		console.log("maximal clique", maximalClique)
	}
	function dowloadJSONData(data, fileName){
		var a = document.createElement("a")
		document.body.appendChild(a)
		a.style = "display: none"
		var json = JSON.stringify(data),
				blob = new Blob([json], {type: "octet/stream"}),
				url = window.URL.createObjectURL(blob)
			a.href = url
			a.download = fileName
			a.click()
			window.URL.revokeObjectURL(url)
	}
	function getFileContent(){
		var file = document.getElementById('loadFile').files[0];
		if (file) {
			// console.log(file)
			if(file.type !== "application/json" && file.type !== "text/csv")
				alert("Only json and csv files are accepted")
			if(file.size > maxAllowedSize)
				alert("File is too big for processing")
			let reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = function (event) {
				// document.getElementById("fileContents").innerHTML = event.target.result;
				console.log(JSON.parse(event.target.result))
				document.getElementById('drawLoadedGraph').style.display = 'block'
				localStorage.setItem('loadedGraph', event.target.result)
			}
			reader.onerror = function (event) {
				// document.getElementById("fileContents").innerHTML = "error reading file";
				console.info("error reading to load file")
				alert("There was an error to load file")
			}
		}
		else
			alert("There was an error on the file")
	}
}());
function setProperties(){
	localStorage.clear()
	localStorage.setItem('range', document.querySelector("#numberOfNodes").value)
	location.reload()
}
function setDefault(){
	localStorage.clear()
	location.reload()
}
