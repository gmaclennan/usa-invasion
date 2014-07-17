var Invasion = Invasion || {};
Invasion.Model = function() {
    var data = {},
        model = {};

    ["cessions", "reservations", "reservationsByStart", "startDate", "endDate"].forEach(function(d) {
            model[d] = function() {
                return data[d];
            };
        });

    model.topojson = function(json) {
        topojson.presimplify(json);

        data.cessions = topojson.feature(json, json.objects.Cession).features.sort(function(a, b) {
            return a.properties.EndDate - b.properties.EndDate;
        });

        data.reservations = topojson.feature(json, json.objects.Reservation).features.sort(function(a, b) {
            return a.properties.EndDate - b.properties.EndDate;
        });

        data.reservationsByStart = data.reservations.slice(0).sort(function(a, b) {
            return a.properties.StartDate - b.properties.StartDate;
        });

        data.startDate = Invasion.util.removeTZ(new Date(data.cessions[0].properties.StartDate));
        data.endDate = Invasion.util.removeTZ(new Date(data.cessions[data.cessions.length - 1].properties.EndDate));
        
        return model;
    };

    return model;
};
