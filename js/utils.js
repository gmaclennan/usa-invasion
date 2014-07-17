var Invasion = Invasion || {};
Invasion.util = {
    dateCeil: function(date) {
        if (!(date instanceof Date)) date = new Date(date);
        return new Date(date.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
    },

    dateFloor: function(date) {
        if (!(date instanceof Date)) date = new Date(date);
        return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
    },

    removeTZ: function(date) {
        var timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
        return new Date(date.valueOf() + timezoneOffset);
    }
};
