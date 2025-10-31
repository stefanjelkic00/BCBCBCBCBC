const server = require('server');

const GTM = require('*/cartridge/scripts/GTM');

server.extend(module.superModule);

server.append('Show', GTM.bind('setProductTileDetails'));

module.exports = server.exports();