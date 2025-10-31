'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    this.on('route:BeforeComplete', function () {
        var viewData = res.getViewData();
        viewData.skipheader = !!req.querystring.swskipheader;
        viewData.skipfooter = !!req.querystring.swskipfooter;
    });
    next();
});

module.exports = server.exports();
