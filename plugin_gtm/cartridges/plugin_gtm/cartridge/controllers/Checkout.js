const server = require('server');

const GTM = require('*/cartridge/scripts/GTM');

server.extend(module.superModule);

server.append('Begin', GTM.bind('setCheckoutData'));

module.exports = server.exports();