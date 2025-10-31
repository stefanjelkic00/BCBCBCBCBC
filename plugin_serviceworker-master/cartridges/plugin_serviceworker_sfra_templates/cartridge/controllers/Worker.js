'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var inheritsFromParent = !!module.superModule;
if (inheritsFromParent) {
    server.extend(module.superModule);
}

server.get('Decorator', server.middleware.https, function (req, res, next) {
    var cacheClearURLs = [
        URLUtils.url('Account-Login').toString(),
        URLUtils.url('Cart-AddProduct').toString(),
        URLUtils.url('Cart-Show').toString()
    ];
    var skipHeaderStream = [
        URLUtils.url('Checkout-Login').toString(),
        URLUtils.url('Checkout-Begin').toString()
    ];

    response.addHttpHeader('X-SF-CC-CacheClearURLs', JSON.stringify(cacheClearURLs));
    response.addHttpHeader('X-SF-CC-SkipHeader', JSON.stringify(skipHeaderStream));

    res.render('common/emptydecorator', { empty: true });
    next();
});

module.exports = server.exports();
