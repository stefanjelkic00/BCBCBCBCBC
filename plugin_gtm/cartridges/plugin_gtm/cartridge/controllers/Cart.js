const server = require('server');

const GTM = require('*/cartridge/scripts/GTM');

server.extend(module.superModule);

server.append('AddProduct', GTM.bind('setProductAddedToCart'));

server.append('RemoveProductLineItem', GTM.bind('setProductRemovedFromCart'));

server.prepend('UpdateQuantity', GTM.bind('setStartingQuantity'));
server.append('UpdateQuantity', GTM.bind('setUpdatedLineItemProductQuantity'));

server.append('AddCoupon', GTM.bind('setCouponAdded'));

module.exports = server.exports();