'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
/**
 * Sends cache context information to the browser
 * @param {Object} req the wrapped request object
 */
function addCacheContext(req) {
    var contextid = 'unknown';
    if (req.querystring.cgid) {
        contextid = 'cgid=' + req.querystring.cgid;
    } else if (req.querystring.q) {
        contextid = 'q=' + req.querystring.q;
    }
    response.addHttpHeader('X-SF-CC-CacheContext', '{"context": "search", "contextid": "' + contextid + '"}');
}

server.append('UpdateGrid', cache.applyPromotionSensitiveCache, function (req, res, next) {
    this.on('route:Complete', function () {
        addCacheContext(req);
    });
    next();
});

server.append('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    this.on('route:Complete', function () {
        addCacheContext(req);
    });
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
