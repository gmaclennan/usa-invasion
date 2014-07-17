var ScrollBehavior = function(endDelay) {
    endDelay = endDelay || 200;
    var dispatch = d3.dispatch("scrollstart", "scroll", "scrollend"),
        scrolling;

    // from https://github.com/mbostock/d3/pull/1050/files
    if ('onwheel' in document) {
        d3_behavior_zoom_wheel = 'wheel';
        d3_behavior_zoom_delta = function() {
            var delta = Math.abs(d3.event.deltaY) > Math.abs(d3.event.deltaX) ? d3.event.deltaY : d3.event.deltaX;
            return -delta * (d3.event.deltaMode ? 20 : 1);
        };
    } else if ('onmousewheel' in document) {
        d3_behavior_zoom_wheel = 'mousewheel';
        d3_behavior_zoom_delta = function() {
            return d3.event.wheelDelta;
        };
    } else {
        d3_behavior_zoom_wheel = 'MozMousePixelScroll';
        d3_behavior_zoom_delta = function() {
            return -d3.event.detail;
        };
    }

    var scrollBehavior = function(selection) {
        selection.on(d3_behavior_zoom_wheel, function() {
            window.clearTimeout(scrolling);

            d3.event = {
                dx: d3_behavior_zoom_delta(),
                type: "scroll",
                sourceEvent: d3.event
            };

            if (!scrolling) dispatch.scrollstart();

            dispatch.scroll();

            scrolling = window.setTimeout(function() {
                scrolling = null;
                dispatch.scrollend();
            }, endDelay);

        });
    };

    return d3.rebind(scrollBehavior, dispatch, "on");
};
