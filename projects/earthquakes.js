// magnitude.js

"use strict";

function draw(geo_data) {

  // graphic settings
  var width = 1366,
      height = 768,
      rad_min = 2,
      rad_max = 15;

  var tip = d3.tip()
              .attr('class', 'd3-tip')
              .offset([-10, 0])
              .html(function(d) {
                return "<strong>Magnitude:</strong> <span style='color:red'\
                  >" + d['Magnitude'] + "</span>";
  });

  // svg element
  var svg = d3.select(".rightpane").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("x", 0)
      .attr("y", 50);

  // add tooltip to svg element
  svg.call(tip);

  // function to convert lon and lat into pixel coordinates
  var projection = d3.geoMercator()
      .scale(230)
      .translate([width / 2, height / 1.6]);
  
  // add world map to svg element
  var path = d3.geoPath().projection(projection);

  var map = svg.append('g')
      .attr('class', 'map')
      .selectAll('path')
      .data(geo_data.features)
      .enter()
    .append('path')
      .attr('d', path)
      .style('fill', 'white')
      .style('stroke', 'black')
      .style('stroke-width', 0.5);

  // plot points for all earthquakes, radius based on strength
  function plot_mag_points(data) {
      
    var magnitude_extent = d3.extent(data, function(d) {
      return d['Magnitude'];
    });

    // radius scale for bubbles
    var radius= d3.scaleLog()
        .domain(magnitude_extent)
        .range([rad_min, rad_max]);
    
    // color scale for bubbles
    var color_scale = d3.scaleSequential()
        .domain([9.1, 5.5])
        .interpolator(d3.interpolateRdYlGn);

    // group data by years
    var nested_data = d3.nest()
        .key(function(d) {
          return d['Date'].getUTCFullYear();
        })
        .entries(data);

    // add bubble for each earthquakt to svg map, coordinates are 
    // converted using the Mercator projection and the radius is 
    // calculated from the magnitude value
    
    // for the display of all the data in the nested structure we start
    // by creating group elements for each year group
    var year_groups = svg.selectAll(".bubbles")
        .data(nested_data)
        .enter()
      .append("g")
        .attr("class", "bubbles")
        .attr("id", function(d) {
          return "y" + d['key'];
        });
    
    // create svg circles for all earthquakes within the different 
    // year groups
    var bubbles = year_groups.selectAll("circle")
        .data(function(d) {
          return d.values;
        })
        .enter()
      .append("circle")
        .attr("cx", function(d) {
          return projection([+d['Longitude'], 
                              +d['Latitude']])[0];
        })
        .attr("cy", function(d) {
          return projection([+d['Longitude'], 
                             +d['Latitude']])[1];
        })
        .attr('r', function(d) {
          return radius(d['Magnitude']);
        })
        .style("fill", function(d) { 
          return color_scale(d['Magnitude']); 
        })
        .style('opacity', 0.4)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    // create legend
    var legend = svg.append('g')
        .attr("class", "legend")
        .attr("transform", "translate(" + (width - 150) + "," + 20 + ")")
        .attr("height", 200)
        .attr("width", 200)
        .selectAll("g")
        .data(["6", "7", "8", "9"])
        .enter();

    // legend title
    svg.select(".legend")
      .append("text")
        .text("Magnitude")
        .attr("x", 40)
        .attr("y", -5)
        .style("font-size", "20px");

    // create bubbles for legend 
    legend.append("circle")
        .attr("cx", 60)
        .attr("cy", function(d, i) {
          return i * 40 + 25;
        })
        .attr("r", radius)
        .style("fill", function(d) { 
          return color_scale(Number(d)); 
        });

    // label the legend bubbles
    legend.append("text")
        .attr("y", function(d, i) {
          return i * 40 + 30;
        })
        .attr("x", 90)
        .text(function(d) {
          return d;
        })
        .style("font-size", "20px");
  };  

  // format used to parse date from string in .csv
  var parse_time = d3.timeParse("%m/%d/%Y");

  // load .csv file and rund plot_mag_points function
  d3.csv('earthquakes_edited.csv', function(d) {
           d['Magnitude'] = parseFloat(d['Magnitude']) // convert to float
           d['Date'] = parse_time(d['Date']) // parse date from string
           return d;
      }, plot_mag_points);

  // list containing all years
  var years = [];
  for (var i = 1965; i <= 2016; i += 1) {
      years.push(i);
  }

  // add checkboxes for all years
  var checkbox_list = d3.select(".leftpane .checkbox-grid")
    .append("ul")
      .selectAll("ul")
      .data(years)
      .enter()
      .append("li");             

  var checkboxes = checkbox_list.append("input")
      .attr("class", "year-checkbox")
      .attr("type", "checkbox")
      .attr("name", "year")
      .attr("value", function(d) {
        return d;
      });

  var checkbox_labels = checkbox_list.append("label")
      .text(function(d) {
        return d;
      })
      .style("color", "#555555")
      .style("font-size", "18px");
};

function update_mag_year(year, svg, clear = true) {
    // display only the earthquakes from a certain year if clear is set to
    // true, otherwise the data displayed before this function call remains

    // display year
    d3.select(".rightpane h2")
        .text(year);

    // make bubbles from previous year fully opaque if clear is set to true
    if (clear && year != 1965) {
        var bubbles_prev_year = svg.selectAll("#y" + (year - 1) + " circle");
        bubbles_prev_year.transition()
          .duration(100)
          .style('opacity', 0.0)                
    }  

    // select all bubbles that correspond with the specified year
    var bubbles_year = svg.selectAll("#y" + year + " circle");

    // display bubbles from current year
    bubbles_year.transition()
      .duration(100)
      .style('opacity', 0.4)

    // display tooltip if clear is set to false as this is when looking at
    // a specific selection and not during the anmation
    if (clear === false) {
        // initiate tooltip
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              return "<strong>Magnitude:</strong> <span style='color:red'>" 
                + d['Magnitude'] + "</span>";
            });

        svg.call(tip);
        // set tooltip on mouseover
        bubbles_year.on('mouseover', tip.show)
          .on('mouseout', tip.hide);
    };        
}

function run_animation() {
    // animation of all the data from each year in chronological order

    // select svg element
    var svg = d3.select(".rightpane svg")

    // remove tooltips when running animation
    d3.select(".d3-tip").remove();

    // list containing all years
    var years = [];
    for (var i = 1965; i <= 2016; i += 1) {
        years.push(i);
    }

    // year animation
    var year_idx = 0;

    var year_interval = setInterval(function() {
        if (year_idx === 0) {
          // hide all bubbles in the first animation frame 
          var bubbles = svg.selectAll(".bubbles circle")
                           
          bubbles.transition()
            .duration(0)
            .style('opacity', 0.0);
        }

        // add bubbles for current year
        update_mag_year(years[year_idx], svg);
        year_idx++;

        // last year reached
        if (year_idx >= years.length) {
            // display tooltip for bubbles of 2016
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                  return "<strong>Magnitude:</strong> <span style='color:red'\
                    >" + d['Magnitude'] + "</span>";
                });

            svg.call(tip);

            var bubbles_2016 = svg.selectAll("#y2016 circle");
            bubbles_2016.on('mouseover', tip.show)
              .on('mouseout', tip.hide);
            
            // stop animation
            clearInterval(year_interval)
        };
    }, 600);   
}

function set_all_checkboxes(check_value) {
  // set all checkboxes either to true or false

  // select all checkboxes
  var checkboxes = document.getElementsByName('year');

  // set the value of all checkboxes
  for (var i = 0; i < checkboxes.length; i++) { 
    if (check_value === true) {
      checkboxes[i].checked = true;
    } else {
      checkboxes[i].checked = false;
    }
  }
};

function display_selection() {

  // select svg element
  var svg = d3.select(".rightpane svg")

  // hide all bubbles 
  var bubbles = svg.selectAll(".bubbles circle")
  
  bubbles.transition()
    .duration(0)
    .style('opacity', 0.0);

  // remove all tooltips
  d3.select(".d3-tip").remove();

  // find all the checked boxes and the correpsonding values 
  var checked_boxes = document.querySelectorAll('.year-checkbox:checked');

  // loop trough all check box values and add the corresponding points to the
  // map
  for (var i = 0; i < checked_boxes.length; i++) {
    var year = checked_boxes[i].value;

    var clear = false;
    update_mag_year(year, svg, clear = clear);
  }

  // set title
  d3.select(".rightpane h2")
      .text("Selection");
}