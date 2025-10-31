'use strict';

var server = require('server');
server.extend(module.superModule);
var Cookie = require('dw/web/Cookie');

server.append('SetSession', function (req, res, next) {
    this.on('route:Complete', function () {
        var consent = (req.querystring.consent === 'true');
        if (consent) {
            var cookie = new Cookie('sfcc-consent', consent);
            cookie.setPath('/');
            response.addHttpCookie(cookie);
        }
    });
    next();
});

module.exports = server.exports();
