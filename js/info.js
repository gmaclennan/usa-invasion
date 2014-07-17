var Invasion = Invasion || {};
Invasion.Info = function() {
    var container,
        selection,
        locked,
        currentDate,
        cessions,
        reservations,
        reservationsByStart,
        startDate,
        endDate,
        format = d3.time.format("%B %_d, %Y"),
        formatShort = d3.time.format("%b %_d %Y");

    var dispatch = d3.dispatch("click");

    function info(selection) {
        container = selection;
        surface = container.append("div")
            .attr("class", "info-pane");
        return info;
    }

    info.clear = function() {
        if (d3.event.type === "click") locked = false;
        if (!locked) info.date(currentDate);
    };

    info.render = function(d) {
        if (d3.event.type === "mouseenter" && locked) return;
        locked = d3.event.type === "click";

        surface.datum(null);
        if (d.properties.Type === "Cession") {
            renderCession(d.properties);
        } else {
            renderReservation(d.properties);
        }
    };

    info.date = function(date) {
        var filtered,
            data = [],
            start = Invasion.util.dateFloor(new Date(date.valueOf() - 1));
        currentDate = date;

        if (date.valueOf() === startDate.valueOf()) {
            surface.html(d3.select(".intro").html());
            return;
        }

        filtered = quickFilter(cessions, start, date);

        if (filtered) data.push({
            key: "Ceded territory",
            values: filtered
        });

        filtered = quickFilter(reservationsByStart, start, date);

        if (filtered) data.push({
            key: "New reservations",
            values: filtered
        });

        filtered = quickFilter(reservations, start, date);

        if (filtered) data.push({
            key: "Ceded reservations",
            values: filtered
        });

        if (typeof surface.datum() === "undefined") surface.html("<h1>During " + new Date(date.valueOf() - 1).getFullYear() + "</h1>");

        roundedDate = Invasion.util.dateFloor(new Date(date.valueOf() + 1));

        if (data.length === 0 && date.valueOf() === roundedDate.valueOf()) surface.append("p")
                .html("No change");

        var section = surface.selectAll("div.section")
            .data(data);
        
        section.enter()
            .append("div")
            .attr("class", "section")
            .append("h3")
            .html(function(d) { return d.key + ":"; });

        section.exit()
            .remove();

        var item = section.selectAll("p.item")
            .data(function(d) { return d.values; });

        item.enter()
            .append("p")
            .attr("class", "item")
            .html(function(d) { 
                return d.key;
            });
        
        item.exit()
            .remove();

        item.selectAll("span")
            .data(function(d) { return d.values; })
            .enter()
            .append("span")
            .html(", ")
            .append("b")
            .append("a")
            .attr("href", "")
            .html(function(d) { return d.properties.CessionID; })
            .on("click.info", function(d, i) { 
                d3.event.preventDefault();
                d3.event.stopPropagation();
                console.log(d);
                dispatch.click(d, i);
            });
            
    };

    info.model = function(model) {
        var nest = d3.nest()
            .key(function(d) { return d.properties.EndDate; })
            .sortKeys(function(a, b) { return d3.ascending(+a, +b); })
            .key(function(d) { return "<i>" + formatShort(new Date(d.properties.EndDate)) + ":</i> " + d.properties.Nation; });

        cessions = nest.entries(model.cessions());
        reservations = nest.entries(model.reservations());

        reservationsByStart = d3.nest()
            .key(function(d) { return d.properties.StartDate; })
            .sortKeys(function(a, b) { return d3.ascending(+a, +b); })
            .key(function(d) { return "<i>" + formatShort(new Date(d.properties.StartDate)) + "</i>: " + d.properties.Nation; })
            .entries(model.reservations());

        startDate = model.startDate();
        endDate = model.endDate();

        return info;
    };

    function quickFilter(arr, startDate, endDate) {
        if (startDate instanceof Date) startDate = startDate.valueOf();
        if (endDate instanceof Date) endDate = endDate.valueOf();
        var a = 0, b;
        for (var i = 0; i < arr.length; i++) {
            if (+arr[i].key < startDate) a = i + 1;
            if (+arr[i].key > endDate) {
                b = i;
                break;
            }
        }
        if (b <= a) return;
        return arr.slice(a, b).reduce(function(previousValue, currentValue) {
            return previousValue.concat(currentValue.values);
        }, []);
    }

    function renderCession(p) {
        var title = p.Nation + " Nation" + (p.Nation.match(/ and /) ? "s" : "");
        surface.html(
            "<h2>" + title + "</h2>" +
            "<p>Ceded on " + format(new Date(p.Cession_Date)) + "</p>" +
            (p.LinkKappler ? "<p><a href='" + p.LinkKappler + "' target='_blank'>Related Treaty</a></p>" : "") +
            (p.LinkRoyce ? "<p><a href='" + p.LinkRoyce + "' target='_blank'>Description of tract " + p.CessionID + "</a></p>" : "")
        );
    }

    function renderReservation(p) {
        var future = currentDate < new Date(p.CreationDate);
        var title = (future ? "Future " : "") + p.Nation + " Reservation";
        surface.html(
            "<h2>" + title + "</h2>" +
            "<p>Reservation created on " + format(new Date(p.CreationDate)) + "</p>" +
            (p.LinkKappler ? "<p><a href='" + p.LinkKappler + "' target='_blank'>Related Treaty</a></p>" : "") +
            (p.LinkRoyce ? "<p><a href='" + p.LinkRoyce + "' target='_blank'>Description of tract " + p.CessionID + "</a></p>" : "")
        );
    }

    return d3.rebind(info, dispatch, "on");
};
