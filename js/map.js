var Invasion = Invasion || {};
Invasion.Map = function() {
    var g, gc, gr, svg,
        viewScale = 1.5,
        cessions,
        reservations,
        reservationsByStart,
        filtered,
        timeline,
        currentDate,
        width = 960,
        height = 500,
        scaleMax = 8,
        active = d3.select(null);

    var dispatch = d3.dispatch("click", "mouseenter", "mouseleave", "reset");

    var zoomBehavior = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .on("zoom", zoom);

    function resize() {
        // svg.call(zoomBehavior.event);
    }

    var projection = d3.geo.albers();

    var path = d3.geo.path()
        .projection({
            stream: function(s) {
                return simplify.stream(projection.stream(s));
            }
        });

    var simplify = d3.geo.transform({
        point: function(x, y, z) {
            if (z > 0.0002) this.stream.point(x, y);
        }
    });

    function map(selection) {

        svg = selection.append("svg")
            .attr("class", "map")
            .attr("viewBox", "70 0 " + (width + 200) + " " + (height + 20) + " ")
            .attr("preserveAspectRatio", "xMidYMid")
            .style("width", "100%")
            .style("height", "100%")
            .on("click", stopped, true);

        svg.insert("rect", ":first-child")
            .attr("class", "background")
            .attr("width", "100%")
            .attr("height", "100%")
            .on("click", reset);

        g = svg.append("g");
        gs = g.append("g")
            .attr("class", "state-boundaries");
        gc = g.append("g")
            .attr("class", "cessions");
        gr = g.append("g")
            .attr("class", "reservations");
        gl = g.append("g")
            .attr("class", "us-border");

        svg.call(zoomBehavior.event);

        d3.select(window).on("resize.land", resize);
        resize();

        return map;
    }

    map.model = function(model) {
        cessions = model.cessions();
        reservations = model.reservations();
        reservationsByStart = model.reservationsByStart();
        return map;
    };

    map.us = function(us) {
        gl.append("path")
            .datum(topojson.feature(us, us.objects.land))
            .attr("d", path);

        gs.append("path")
            .datum(topojson.mesh(us, us.objects.states, function(a, b) {
                return a !== b;
            }))
            .attr("d", path);
    };

    function zoom() {
        gc.style("stroke-width", 1.5 / d3.event.scale / viewScale + "px");
        gr.style("stroke-width", 1 * +(d3.event.scale !== 1) / d3.event.scale / viewScale + 0.5 / d3.event.scale / viewScale + "px");
        gl.style("stroke-width", 1 / d3.event.scale / viewScale + "px");
        gs.style("stroke-width", 1 / d3.event.scale / viewScale + "px");
        g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    map.render = function(date) {
        if (!cessions || !reservations) return;
        date = Invasion.util.removeTZ(date);
        var roundedDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
        if (roundedDate === currentDate) return;

        renderCessions(roundedDate);

        if (roundedDate > currentDate) {
            renderFutureReservations(roundedDate);
            renderReservations(roundedDate);
        } else {
            renderReservations(roundedDate);
            renderFutureReservations(roundedDate);
        }

        currentDate = roundedDate;
    };

    function renderCessions(date) {
        for (var i = 0; i < cessions.length; i++) {
            if (cessions[i].properties.EndDate >= date) break;
        }
        filtered = cessions.slice(i);

        var shape = gc.selectAll("path")
            .data(filtered, function(d) {
                return "c" + d.properties.CessionID;
            });

        shape.enter().append("path")
            .attr("d", path)
            .attr("class", "feature")
            .attr("id", function(d) { return "c" + d.properties.CessionID; })
            .style("fill", "#a1d99b")
            .on("click", clicked)
            .on("mouseenter", dispatch.mouseenter)
            .on("mouseleave", dispatch.mouseleave);

        shape.style("opacity", 1);

        shape.exit()
            .transition()
            .style("opacity", 0)
            .remove();
    }

    function renderFutureReservations(date) {
        for (var i = 0; i < reservationsByStart.length; i++) {
            if (reservationsByStart[i].properties.StartDate > date) break;
        }
        filtered = reservationsByStart.slice(i);

        var shape = gr.selectAll("path")
            .data(filtered, function(d) {
                return "c" + d.properties.CessionID;
            });

        shape.enter().append("path")
            .attr("d", path)
            .attr("class", "feature")
            .attr("id", function(d) { return "c" + d.properties.CessionID; })
            .on("click", clicked)
            .on("mouseenter", dispatch.mouseenter)
            .on("mouseleave", dispatch.mouseleave);

        shape.style("opacity", 1)
            .classed("reservation", false)
            .transition()
            .style("fill", "#a1d99b")
            .style("stroke", "#ffffff");

        shape.exit()
            .transition()
            .duration(500)
            .style("fill", "#ef3b2c")
            .style("stroke", "#cb181d");
    }

    function renderReservations(date) {
        for (var i = 0; i < reservations.length; i++) {
            if (reservations[i].properties.EndDate >= date) break;
        }
        filtered = reservations.slice(i);

        var shape = gr.selectAll("path")
            .data(filtered, function(d) {
                return "c" + d.properties.CessionID;
            });

        shape.enter().append("path")
            .attr("d", path)
            .attr("class", "feature")
            .attr("id", function(d) { return "c" + d.properties.CessionID; })
            .style("fill", "#ef3b2c")
            .style("stroke", "#cb181d")
            .on("click", clicked)
            .on("mouseenter", dispatch.mouseenter)
            .on("mouseleave", dispatch.mouseleave);

        shape.style("opacity", 1)
            .classed("reservation", true);

        shape.exit()
            .transition()
            .style("opacity", 0)
            .remove();
    }

    map.zoomTo = function(d, i) {
        var area = svg.select("#c" + d.properties.CessionID);

        if (area.size() === 0) {
            area = g.append("g")
                .attr("class", "temp")
                .append("path")
                .attr("d", path(d))
                .attr("id", "c" + d.properties.CessionID);
        }

        clicked.call(area.node(), d, i);
    };

    function clicked(d, i) {
        if (active.node() === this) return reset();
        active.classed("active", false);
        active = d3.select(this).classed("active", true);
        // d3.select(this.parentNode).append(function() {
        //     return active.node();
        // });
        dispatch.click.call(this, d, i);

        var bounds = path.bounds(d),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            x = (bounds[0][0] + bounds[1][0]) / 2,
            y = (bounds[0][1] + bounds[1][1]) / 2,
            scale = Math.min(scaleMax, 0.9 / Math.max(dx / width, dy / height)),
            translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(750)
            .call(zoomBehavior.translate(translate).scale(scale).event);
    }

    function reset() {
        if (d3.event.defaultPrevented) d3.event.stopPropagation();
        active.classed("active", false);
        active = d3.select(null);
        g.selectAll("g.temp").remove();

        svg.transition()
            .duration(750)
            .call(zoomBehavior.translate([0, 0]).scale(1).event);

        dispatch.reset();
    }

    // If the drag behavior prevents the default click,
    // also stop propagation so we don’t click-to-zoom.

    function stopped() {
        if (d3.event.defaultPrevented) d3.event.stopPropagation();
    }

    return d3.rebind(map, dispatch, "on");
};
