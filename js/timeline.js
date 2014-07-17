var Invasion = Invasion || {};
Invasion.Timeline = function() {
    var container,
        surface,
        pointer,
        width,
        height,
        step = 150,
        startDate,
        endDate,
        scale,
        axis,
        adjusting,
        pendingRedraw,
        dx = 0,
        x = 0;

    var dispatch = d3.dispatch("move");

    var drag = d3.behavior.drag()
        .on("drag", move)
        .on("dragend", adjust);

    var scroll = ScrollBehavior(250)
        .on("scroll", move)
        .on("scrollend", adjust);

    function resize() {
        // width = container.dimensions()[0];
        // height = container.dimensions()[1];
        // step = 200;
        // pointer.attr("transform", "translate(" + 2 * step / 3 + ",900)");
        // if (endDate) move(0);
    }

    function timeline(selection) {
        container = selection;

        var svg = selection.append("svg")
            .style("height", "100%")
            .attr("viewBox", "0 0 99999 900")
            .attr("preserveAspectRatio", "xMinYMin slice")
            .attr("pointer-events", "none");

        timeline.surface = surface = svg.append("g")
            .attr("class", "slider")
            .attr("cursor", "col-resize")
            .attr("pointer-events", "all");

        svg.insert("rect", ":first-child")
            .attr("class", "background")
            .attr("width", "100%")
            .attr("height", "24")
            .attr("cursor", "col-resize")
            .attr("pointer-events", "all")
            .attr("transform", "translate(0,876)")
            .call(drag);

        pointer = svg.append("g")
            .attr("transform", "translate(" + 3 * step / 4 + ",900)");

        pointer.append("path")
            .attr("d", "M 0 -18 L 18 0 L -18 0 Z")
            .attr("class", "pointer");

        d3.select(window).on("resize", resize);
        resize();

        container.call(scroll);
        surface.call(drag);

        return timeline;
    }

    timeline.domain = function(domain) {

        startDate = Invasion.util.dateFloor(domain[0]);
        endDate = Invasion.util.dateCeil(domain[1]);

        timeline.scale = scale = d3.time.scale()
            .domain([startDate, endDate])
            .range([0, step * d3.time.years(startDate, endDate).length]);

        axis = d3.svg.axis()
            .scale(scale)
            .orient("top")
            .ticks(d3.time.years)
            .tickSize(24, 0)
            .tickPadding(16)
            .tickFormat(d3.time.format("%Y"));

        surface.call(axis);

        surface.selectAll("line")
            .data(scale.ticks(d3.time.month), function(d) {
                return d;
            })
            .enter()
            .append("line")
            .attr("class", "minor")
            .attr("y1", 0)
            .attr("y2", -12)
            .attr("x1", scale)
            .attr("x2", scale);

        move(0);

        return timeline;
    };

    function move(_) {
        if (d3.event && 'sourceEvent' in d3.event) {
            d3.event.sourceEvent.preventDefault();
            d3.event.sourceEvent.stopPropagation();
            dx = d3.event.dx || 0;
        } else {
            dx = _ || 0;
        }
        x = Math.max(-scale(endDate), Math.min(0, x + dx));

        requestRedraw();
    }

    function adjust() {
        var date = scale.invert(-x),
            targetDate;

        if (dx > 0 && date.getMonth() > 5 || date.getMonth() > 6) {
            targetDate = Invasion.util.dateCeil(date);
        } else {
            targetDate = Invasion.util.dateFloor(date);
        }

        adjusting = true;
        dispatch.move(targetDate);
        timeline.date(targetDate);
    }

    timeline.date = function(date) {
        var targetPos,
            start = Date.now(),
            duration,
            ease = d3.ease("circle-in-out"),
            startPos = x;

        if (!arguments.length) return scale.invert(x);

        targetPos = -scale(date);

        duration = Math.min(2000, Math.abs(targetPos - x) * 8);
        var adjustment = d3.interpolate(x, targetPos);

        function scroll() {
            if (Date.now() < start + duration && !pendingRedraw) {
                x = adjustment(ease((Date.now() - start) / duration));
                requestRedraw(scroll);
            } else {
                x = targetPos;
                adjusting = false;
                requestRedraw();
            }
        }

        scroll();
    };

    function requestRedraw(cb) {
        if (!pendingRedraw) pendingRedraw = window.requestAnimationFrame(render);

        function render() {
            var fontSize = d3.interpolate("1.6em", "7em"),
                textOffset = d3.interpolate(-40, -60),
                ease = d3.ease("cubic-in-out");

            surface.attr("transform", "translate(" + (3 * step / 4 + x) + ",900)");
            surface.selectAll(".tick")
                .select("text")
                .style("font-size", function(d) {
                    var t = (step - Math.min(step, Math.abs(scale(d) + x))) / step;
                    return fontSize(ease(t));
                })
                .attr("y", function(d) {
                    var t = (step - Math.min(step, Math.abs(scale(d) + x))) / step;
                    return textOffset(ease(t));
                });
            if (!adjusting) dispatch.move(scale.invert(-x));
            pendingRedraw = null;
            if (cb) cb();
        }
    }

    return d3.rebind(timeline, dispatch, "on");
};
