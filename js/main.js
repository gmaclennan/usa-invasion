var div = d3.select("body")
    .append("div")
    .attr("class", "container");

var timeline = Invasion.Timeline();
var map = Invasion.Map();
var info = Invasion.Info();
var model = Invasion.Model();

timeline
    .on("move.map", map.render)
    .on("move.info", info.date);
map
    .on("click", info.render)
    .on("mouseenter", info.render)
    .on("mouseleave", info.clear)
    .on("reset", info.clear);
info
    .on("click", map.zoomTo);

div.call(map);
div.call(timeline);
div.call(info);

d3.json("geo/topojson/ilc_polys_simp.json", function(error, ilc) {
    model.topojson(ilc);
    map.model(model);
    info.model(model);
    timeline.domain([model.startDate(), model.endDate()]);
});

d3.json("geo/topojson/us-10m.json", function(error, us) {
    topojson.presimplify(us);
    map.us(us);
});
