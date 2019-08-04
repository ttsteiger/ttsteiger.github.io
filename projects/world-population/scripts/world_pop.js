// worl_pop.js

"use strict";

// helper functions
var parseDate = d3.timeParse("%Y");

function findMinMax(arr, key) {
	// find minimum and maximum value in array
	let min = arr[0][key], max = arr[0][key];

	for (let i = 1, len=arr.length; i < len; i++) {
		let v = arr[i][key];
		min = (v < min) ? v : min;
		max = (v > max) ? v : max;
	}
	return [min, max];
}

function convertString(string) {
	// convert string to be usable as ID/class
	return string.replace(/[^a-zA-Z]/g, "");
}

// country metadata
var metaData = {"country": {"region": "", "income": "", "lastPopulation": ""},}

// svg sizing
var margin = {top: 30, right: 250, bottom: 30, left: 35},
	width = 1080 - margin.left - margin.right,
	height = 960 - margin.top - margin.bottom;

// styling
var areaFill = "#1DABE6",
	areaFillHighlighted = "#005084",
	areaFillSelectHighlighted = "#007CB4",
	axisColor = "#BEBEBE";

// axis data
var xTicks = [parseDate(2000), parseDate(2002), parseDate(2004), parseDate(2006),
		parseDate(2008), parseDate(2010), parseDate(2012), parseDate(2014),
		parseDate(2016), parseDate(2017)];
var yTickLabels = ["-10%", "0%", "+10%", "+20%", "+30%", "+40%", "+50%",
	"+60%", "+70%", "+80%", "+90%"];

// legend data
var legendData = [
	{label: "1B", heightPerc: 0.07277341022216513},
	{label: "500M", heightPerc: 0.037541859894346594},
	{label: "10M", heightPerc: 0.003014940573084428}
];

var legendWidth = 250,
	legendHeight = 100;

// label displacement
var labelDis = 40; // distance between line end and label			

// append the svg obgect to the body of the page
var svg = d3.select(".graph-container").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// import data and populate svg
Promise.all([
	d3.csv("pop_total.csv"),
	d3.csv("metadata.csv"),
]).then(function(files) {

	// assign filesselect-position-div
	var data = files[0],
		metaData = files[1];

	// get column headers
	var countries = d3.keys(data[0]);
	countries.shift();

	// remove all entries with _ (denoting upper/lower limits)
	for (var i = countries.length - 1; i >= 0; i--) {
			if (countries[i].indexOf("_") > -1)  { 
				countries.splice(i, 1);  
			} 
	};
	
	// format data
	data.forEach(function(d) {
		d['Year'] = parseDate(d['Year']);

		countries.forEach(function(c) {
			d[c] = parseFloat(d[c])
		})
	});

	// get min/max percentage changes
	var minMaxChanges = [];

	countries.forEach(function(c) {
		var lims = findMinMax(data, c)
		minMaxChanges.push(lims)
	})

	var maxChange = Math.max(...[].concat(...minMaxChanges));
	var minChange = Math.min(...[].concat(...minMaxChanges));

	// set data ranges and scales
		var xscale = d3.scaleTime()
			.domain(d3.extent(data, function(d) { return d['Year']; })) 
		.range([0, width]);

	var yscale = d3.scaleLinear()
		.domain([-0.15, 0.9])
		.range([height, 0]);
	
	// add gridlines to graph
	svg.append("g")
		.attr("class", "grid x-grid")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(xscale)
			.tickValues(xTicks)
			.tickSize(-height)
			.tickFormat("")
	);

	svg.append("g")
		.attr("class", "grid y-grid")
		.call(d3.axisLeft(yscale)
			.tickSize(-width)
			.tickFormat("")
	);

	// get unique metadata values
	var incomeGroups = metaData.map(x => x.IncomeGroup)
		.filter((value, index, self) => self.indexOf(value) === index);

	// add foreign object container
	var foreignObject = svg.append('foreignObject')
		.attr("width", 250)
		.attr("height", 200)
		.attr("x", width/20)
		.attr("y", 3.5 * legendHeight)
		.attr("overflow", "visible")

	// selector container
	var selectContainer = foreignObject.append("xhtml:div")
		.attr("class", "select-container");

	// selector description
	selectContainer.append("xhtml:p")
		.html("Select Income Group:")
		.attr("class", "select-description");

	// selector
	var selectDiv = selectContainer.append("xhtml:div")
		.attr("class", "select-position-div")
			.append("xhtml:div")
			.attr("class", "select-div");

	selectDiv.append("xhtml:span")
		.attr("class", "arr");

	selectDiv.append("xhtml:select")
		.attr("id", "selectIncomeButton");

	// selector background
	selectContainer.append("rect")
		.attr("fill", "white")
		.attr("width", legendWidth)
		.attr("height", legendHeight);

	// add all income groups selection
	d3.select("#selectIncomeButton")
		.append("option")
			.attr("class", "income-option")
			.text("None")
			.attr("value", "None");

	// add income group options to dropdown
	d3.select("#selectIncomeButton")
		.selectAll()
		.data(incomeGroups)
		.enter()
			.append("option")
			.attr("class", "income-option")
				.text(function (d) { return d.replace(' income',''); }) // text shown in dropdown
				.attr("value", function (d) { return d; }) // value returned by selection

	for (var i = 0; i < countries.length; i++) {
		
		// replace special characters in country name for id usage
		var countryID = convertString(countries[i]);

		// find income group & region
		var incomeGroup = convertString(metaData.find(x => x.Country === countries[i]).IncomeGroup),
			region = convertString(metaData.find(x => x.Country === countries[i]).Region);

		// group that holds country components
		var countryGroup = svg.append("g")
			.attr("class", "country-group " + incomeGroup)
			.attr("id", countryID)
			.attr("data-country", countries[i]);

		// plot lower and upper limit line for each country
		var lineMid = d3.line()
			.x(function(d) { return xscale(d['Year']); })
			.y(function(d) { return yscale(d[countries[i]]); });

		var lineLow = d3.line()
			.x(function(d) { return xscale(d['Year']); })
			.y(function(d) { return yscale(d[countries[i] + '_low']); });

		var lineUp = d3.line()
			.x(function(d) { return xscale(d['Year']); })
			.y(function(d) { return yscale(d[countries[i] + '_up']); });

		countryGroup.append("path")
			.datum(data)
			.attr("class", "line")
			.attr("id", countryID + "_mid")
			.attr("d", lineMid);

		countryGroup.append("path")
			.datum(data)
			.attr("class", "line")
			.attr("id", countryID + "_low")
			.attr("d", lineLow);

		countryGroup.append("path")
			.datum(data)
			.attr("class", "line")
			.attr("id", countryID + "_up")
			.attr("d", lineUp);

		// fill area between lines
		var area = d3.area()
			.x(function(d) { return xscale(d['Year']); })
			.y0(function(d) { return yscale(d[countries[i] + '_low']); })
			.y1(function(d) { return yscale(d[countries[i] + '_up']); });

		countryGroup.append("path")
			.datum(data)
			.attr("class", "area " + incomeGroup)
			.attr("d", area)
			.attr("id", countryID + "_area")
			.attr("fill", areaFill)
			.attr("opacity", 0.4)
			.on("mouseover", mouseOver)
			.on("mouseout", mouseOut);
		};

	// add x- and y-axis
	svg.append("g")
		.attr("transform", "translate(0, " + height + ")")
		.attr("class", "axis")
		.call(d3.axisBottom()
			.scale(xscale)
			.tickValues(xTicks));

	 svg.append("g")
	 	.attr("class", "axis")
		.call(d3.axisLeft()
			.scale(yscale)
			.tickFormat(function(d, i) {return yTickLabels[i]}));

	// add legend
	var legend = svg.append('g')
		.attr("class", "legend")
		.attr("transform", "translate(" + width/20
			 + "," + margin.top +")")
		.attr("height", legendHeight)
		.attr("width", legendWidth)
		.selectAll("g")
		.enter();

	// legend background
	svg.select(".legend")
		.append("rect")
		.attr("fill", "white")
		.attr("width", legendWidth)
		.attr("height", legendHeight);

	// legend title
	svg.select(".legend")
		.append("text")
		.attr("class", "legend-title")
		.text("Population")
		.attr("x", legendWidth/2)
		.attr("y", 0);

	// population height rectangles
	for (var i = 0; i < legendData.length; i++) {
		var heightPerc = legendData[i].heightPerc;
		var heightPx = yscale(0) - yscale(heightPerc);
		legendData[i].heightPx = heightPx;
		console.log(heightPx);
	}

	// add rects to legend
	var legendRects = svg.select(".legend")
		.selectAll("g")
		.attr("class", "legend-rect-group")
		.data(legendData)
		.enter()
		.append("g");

	var rectWidth = (legendWidth - 2*10 - 2*5)/3;

	legendRects.append("rect")
			.attr("class", "legend-rect")
			.attr("x", function(d, i) {return 10 + i* (rectWidth + 5)})
			.attr("y", function(d, i) {return legendHeight/3 + (legendData[0].heightPx - d.heightPx)/2})
			.attr("width", rectWidth)
			.attr("height", function(d) { return d.heightPx; });

	// add labels to rects
	legendRects.append("text")
		.text(function(d) {return d.label})
		.attr("class", "legend-rect-label")
		.attr("x", function(d, i) {return i * legendWidth/3 + (legendWidth/3/2)})
		.attr("y", legendHeight/3 + 5 + legendData[0].heightPx)
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "hanging");


	// highlight selected group
	function highlightGroup(selectedGroup) {

		// label optimizer arrays
		var labelArr = [],
			anchorArr = [];

		// unselect all countries
		d3.selectAll(".area")
			.classed("selected", false)
			.transition().duration(200)
				.attr("opacity", 0.4)
				.attr("fill", areaFill);

		// remove labels
		d3.selectAll(".label")
			.attr("fill", "none")
			.remove();

		// remove leader lines
		d3.selectAll(".leader-line")
			.attr("fill", "none")
			.remove();

		// highlight selected group
		d3.selectAll(".area").filter("." + selectedGroup)
			.classed("selected", true)
			.transition().duration(200)
				.attr("fill", areaFillSelectHighlighted)
				.attr("opacity", 1.0);

		// collect label data & add label elements
		d3.selectAll(".country-group" + "." + selectedGroup)
			.each(function(d) {
				var country = d3.select(this).attr("data-country"),
					countryID = convertString(country),
					xPosLabel = d3.select(this).select("#" + countryID + "_mid").node().getBBox().width + labelDis,
					lineLen = d3.select(this).select("#" + countryID + "_mid").node().getTotalLength(),
					yPosLabel = d3.select(this).select("#" + countryID + "_mid").node().getPointAtLength(lineLen).y;

				labelArr.push({x: xPosLabel, y: yPosLabel, name: country, width: 0.0, height: 0.0, incomeGroup: incomeGroup});
				anchorArr.push({x: xPosLabel, y: yPosLabel,r: 0.0});

				d3.select(this)
					.append("text")
					.attr("class", "label")
			});

		// draw labels
		var labels = d3.selectAll(".label")
			.data(labelArr)
			.attr('text-anchor', 'start')
			.text(function(d) { return d.name; })
			.attr("x", function(d) { return (d.x); })
			.attr("y", function(d) { return (d.y); })
			.attr("alignment-baseline", "middle")
			.attr("fill", "none");

		// get label sizes
		var i = 0;
		labels.each(function() {
			labelArr[i].width = d3.select(this).node().getBBox().width;
			labelArr[i].height = d3.select(this).node().getBBox().height;
			i += 1;
		})

		// optimize label placement
		d3.labeler()
			.label(labelArr)
			.anchor(anchorArr)
			.width(width)
			.height(height)
			.start(3000);

		// redraw labels
		labels
			.attr("x", function(d) { return (d.x); })
			.attr("y", function(d) { return (d.y); })
			.transition().duration(200)
				.attr("fill", "#808080");

		// add leader lines
		var leadLines = [];
		for (var i=0; i < labelArr.length; i++) {
			leadLines.push([{x: labelArr[i].x - 3, y: labelArr[i].y}, {x: anchorArr[i].x - (labelDis), y: anchorArr[i].y}]);
		}

		var leadLine = d3.line()
			.x(function (d) { return d.x; })
			.y(function (d) { return d.y; });

		for (var i=0; i < leadLines.length; i++) {
			svg.append("path")
			.attr("class", "leader-line")
			.datum(leadLines[i])
			.attr("d", leadLine)
			.attr("fill", "#808080")
			.attr("stroke", "#808080");
		}

	};

	// add action to changing selection
	d3.select("#selectIncomeButton")
		.on("change", function(d) {
			// get selected value from dropdown
			var selectedGroup = convertString(d3.select(this).property("value"));
			
			// highlight based on selection
			highlightGroup(selectedGroup);
		});

	// hover functions
	function mouseOver(d) {
		// only act on mouseover if line is not affected by selector
		// and no clone area is displayed
		if (d3.select(this).classed("selected") === false) {
			// highlight area
			d3.select(this)
				.transition().duration(200)
					.attr("fill", areaFillHighlighted)
					.attr("opacity", 1.0);

			// hide labels from income selection
			d3.selectAll(".label")
				.transition().duration(200)
					.attr("fill", "none");

			// hide leader lines
			d3.selectAll(".leader-line")
				.transition().duration(200)
					.attr("fill", "none")
					.attr("stroke", "none");

			// add line label
			var country = d3.select(this.parentNode).attr("data-country"),
				countryID = convertString(country),
				xPosLabel = d3.select("#" + countryID + "_mid").node().getBBox().width + labelDis,
				lineLen = d3.select("#" + countryID + "_mid").node().getTotalLength(),
				yPosLabel = d3.select("#" + countryID + "_mid").node().getPointAtLength(lineLen).y;

			var label = d3.select(this.parentNode)
				.append("text")
				.attr("class", "hover-label")
				.attr("id", countryID + "_label")
				.text(country)
				.attr("x", xPosLabel)
				.attr("y", yPosLabel)
				.attr("alignment-baseline", "middle")
						
			label.transition().duration(200)
				.attr("fill", "#808080");
		}
	}

	function mouseOut(d) {
		// only act on mouseover if line is not affected by selector
		if (d3.select(this).classed("selected") === false) {
			
			// reduce line opacity
			d3.select(this)
				.transition().duration(200)
					.attr("fill", areaFill)
					.attr("opacity", 0.4);

			// remove line label
			var labelID = d3.select(this).attr("id").split("_")[0] + "_label";
				d3.selectAll("#" + labelID)
					.remove();

			// show hidden labels again
			d3.selectAll(".label")
				.transition().duration(200)
					.attr("fill", "#808080");

			// show hidden leader lines again
			d3.selectAll(".leader-line")
				.transition().duration(200)
					.attr("fill", "#808080")
					.attr("stroke", "#808080");
		}
	}
});