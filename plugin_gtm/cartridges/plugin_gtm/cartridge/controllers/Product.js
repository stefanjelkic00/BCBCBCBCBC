const server = require('server');

const GTM = require('*/cartridge/scripts/GTM');

server.extend(module.superModule);

server.append('Show', GTM.bind('setProductDetails'));
server.append('Variation', GTM.bind('setProductDetails'));

module.exports = server.exports();