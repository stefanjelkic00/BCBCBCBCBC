'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    var Template = require('dw/util/Template');

    var origin = URLRedirectMgr.redirectOrigin;

    if (origin.match(/service-worker([a-z.])*\.js/)) {
        // add globals for service-worker context
        var publicJS = new Template((origin.match(/service-worker([a-z.])*\.js/)[0])).render().text;
        response.setContentType('text/javascript');
        response.writer.print(publicJS);
    } else if (origin.indexOf('pwa-manifest.json') > -1) {
        response.setContentType('application/manifest+json');
        response.writer.print(JSON.stringify(require('*/cartridge/scripts/pwa-manifest.js')));
    } else {
        next();
    }
});

module.exports = server.exports();
