Promise.all([ // load multiple files
	d3.json('airports.json'),
	d3.json('world-110m.json')
]).then(data => { // or use destructuring :([airports, wordmap])=>{ ... 
	let airports = data[0]; // data1.csv
	let worldmap = data[1]; // data2.json
    console.log(data);
    renderChart(airports, worldmap);
});

var type = "force";

const width = 600;
const height = 400;

const svg = d3.selectAll(".chart").append('svg')
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

function renderChart(dataset, worldmap, {nodeSrength, linkStrength} = {}) {

    const sizeScale = d3.scaleLinear()
        .range([1, 10]);

    const worldJson = topojson.feature(worldmap, worldmap.objects.countries);
    const projection = d3.geoNaturalEarth1()
        .fitExtent([[0,0], [width,height]], worldJson);
    const path = d3.geoPath()
        .projection(projection);
    
    const map = svg.append('path')
        .datum(worldJson)
        .attr('d', path)
        .style('opacity', 0)

    const outline = svg.append('path')
        .datum(topojson.mesh(worldmap, worldmap.objects.countries))
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('class', 'subunit-boundary');

    const drag =  force => {    
        function dragstarted(event) {
            console.log('dragstart')
            if (!event.active) force.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
    
        function dragged(event) {
            console.log('dragged')
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
    
        function dragended(event) {
            console.log('dragend')
            if (!event.active) force.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
    
        return d3.drag()
            .filter(event => type === 'force')
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    sizeScale.domain([0, d3.max(dataset.nodes, d => d.passengers)]);

    // var linkStroke = "#999"; // link stroke color
    // var linkStrokeOpacity = 0.6; // link stroke opacity
    // var linkStrokeWidth = 1.5; // given d in links, returns a stroke width in pixels
    // var linkStrokeLinecap = "round"; // link stroke linecap
    // const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    // const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

    // const link = svg.append("g")
    //     .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
    //     .attr("stroke-opacity", linkStrokeOpacity)
    //     .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
    //     .attr("stroke-linecap", linkStrokeLinecap)
    //     .selectAll("line")
    //     .data(dataset.links)
    //     .join("line");

    // create force simulation d3.forceSimulation
    const force = d3.forceSimulation(dataset.nodes)
    .force('charge', d3.forceManyBody().strength(-5))
    .force('link', d3.forceLink(dataset.links).distance(30))
    .force('center', d3.forceCenter()
        .x(width / 2)
        .y(height / 2)
        .strength(1.5));
    // .on('tick', ticked);

    // var nodeFill = "#FFA500"; // node stroke fill (if not using a group color encoding)
    // var nodeStroke = "#fff"; // node stroke color
    // var nodeStrokeWidth = 1.5; // node stroke width, in pixels
    // var nodeStrokeOpacity = 1; // node stroke opacity
    // var nodeRadius = 5;
    
    // const node = svg.append("g")
    //     .attr("fill", nodeFill)
    //     .attr("stroke", nodeStroke)
    //     .attr("stroke-opacity", nodeStrokeOpacity)
    //     .attr("stroke-width", nodeStrokeWidth)
    //     .selectAll("circle")
    //     .data(dataset.nodes)
    //     .join("circle")
    //     .attr("r", nodeRadius)
    //     .call(drag(force));

    // if (W) link.attr("stroke-width", ({index: i}) => W[i]);
    // if (L) link.attr("stroke", ({index: i}) => L[i]);
    //if (G) node.attr("fill", ({index: i}) => color(G[i]));
    //if (T) node.append("title").text(({index: i}) => T[i]);
    //if (invalidation != null) invalidation.then(() => force.stop());

    // function ticked() {
    //     link
    //         .attr("x1", d => d.source.x)
    //         .attr("y1", d => d.source.y)
    //         .attr("x2", d => d.target.x)
    //         .attr("y2", d => d.target.y);

    //     node
    //         .attr("cx", d => d.x)
    //         .attr("cy", d => d.y);
    // }

    const links = svg.selectAll('line')
        .data(dataset.links)
        .enter()
        .append('line')
        .style('stroke', '#ccc')
        .style('stroke-width', 1);

    const circles = svg
        .selectAll("circle")
        .data(dataset.nodes)
        .enter()
        .append('circle')
        .attr('r', d => sizeScale(d.passengers))
        .style('fill', 'orange')
        .call(drag(force));

    circles
        .append("title").text(d => d.name)
        .style("visability", "visible");

    force.on('tick', function() {
        circles
            .attr('cx', d => {
                d.x = Math.max(10, Math.min(width - 10, d.x)); 
                return d.x;
            })
            .attr('cy', d => {
                d.y = Math.max(10, Math.min(height - 10, d.y));
                return d.y;
            });
        links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
    });

    function changeChart() {
        console.log(type);
        if (type == 'map') {
            force.stop();
            circles.transition(1000)
                .attr('cx', d => d.x = projection([d.longitude, d.latitude])[0])
                .attr('cy', d => d.y = projection([d.longitude, d.latitude])[1]);
            links.transition(1000).attr("x1", function(d) { return d.source.x; })
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            map.transition(1000).style('opacity', 1);
            outline.transition(1000).style('opacity', 1);
        }
        else {
            force.alpha(1).restart();
            map.transition(1000).style('opacity', 0);
            outline.transition(1000).style('opacity', 0);
        }
    }

    d3.selectAll('input[name=type]').on('change', event => {
        type = event.target.value;
        changeChart();
    })
}