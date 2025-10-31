'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.prepend('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    this.on('route:BeforeComplete', function (requ, resp) {
        var viewData = resp.getViewData();
        viewData.criticalCSSTemplate = 'critical-css/search';
        resp.setViewData(viewData);
    });
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
