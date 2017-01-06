"use strict";

// external modules
var seedrandom = require('seedrandom');

// core
module.exports = function(name) {
    var colors = ["#5A8770", "#B2B7BB", "#6FA9AB", "#F5AF29", "#0088B9", "#F18636", "#D93A37", "#A6B12E", "#5C9BBC", "#F5888D", "#9A89B5", "#407887", "#9A89B5", "#5A8770", "#D33F33", "#A2B01F", "#F0B126", "#0087BF", "#F18636", "#0087BF", "#B2B7BB", "#72ACAE", "#9C8AB4", "#5A8770", "#EEB424", "#407887"];
    var color = colors[Math.floor(seedrandom(name)() * colors.length)];
    var letter = name.substring(0, 1).toUpperCase();

    var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
    svg += '<svg xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" height="96" width="96" version="1.1" viewBox="0 0 96 96">';
    svg += '<g>';
    svg += '<rect width="96" height="96" fill="' + color + '" />';
    svg += '<text font-size="64px" font-family="sans-serif" text-anchor="middle" fill="#ffffff">';
    svg += '<tspan x="48" y="72" stroke-width=".26458px" fill="#ffffff">' + letter + '</tspan>';
    svg += '</text>';
    svg += '</g>';
    svg += '</svg>';

    return 'data:image/svg+xml;base64,' + new Buffer(svg).toString('base64');
};
