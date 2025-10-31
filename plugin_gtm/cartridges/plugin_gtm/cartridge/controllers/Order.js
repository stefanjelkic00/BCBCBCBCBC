const server = require('server');

const GTM = require('*/cartridge/scripts/GTM');

server.extend(module.superModule);

server.append('Confirm', GTM.bind('setPurchaseData'));

module.exports = server.exports();