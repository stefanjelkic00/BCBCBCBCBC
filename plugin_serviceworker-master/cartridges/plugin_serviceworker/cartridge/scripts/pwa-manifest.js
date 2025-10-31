var URLUtils = require('dw/web/URLUtils');
var manifest = {
    short_name: 'Commerce Cloud',
    name: 'Salesforce Storefront Reference Architecture',
    icons: [
        {
            src: URLUtils.staticURL('/salesforce512.png').toString(),
            type: 'image/png',
            sizes: '512x512'
        },
        {
            src: URLUtils.staticURL('/salesforce192.png').toString(),
            type: 'image/png',
            sizes: '192x192'
        }
    ],
    start_url: URLUtils.url('Home-Show').toString(),
    background_color: '#FFFFFF',
    scope : '/',
    display: 'standalone',
    theme_color: '#21A0DF'
};

module.exports = manifest;
