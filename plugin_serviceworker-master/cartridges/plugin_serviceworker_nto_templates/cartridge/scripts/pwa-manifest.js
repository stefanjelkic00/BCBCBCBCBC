var URLUtils = require('dw/web/URLUtils');
var manifest = {
    short_name: 'Northern Trail',
    name: 'Salesforce Northern Trail Commerce',
    icons: [
        {
            src: URLUtils.staticURL('/nto512.png').toString(),
            type: 'image/png',
            sizes: '512x512'
        },
        {
            src: URLUtils.staticURL('/nto192.png').toString(),
            type: 'image/png',
            sizes: '192x192'
        }
    ],
    start_url: URLUtils.url('Home-Show').toString(),
    background_color: '#FFFFFF',
    display: 'standalone',
    theme_color: '#21A0DF'
};

module.exports = manifest;
