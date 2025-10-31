'use strict';

module.exports = function Product(factoryProduct) {
    const apiProduct = factoryProduct.raw;

    const product = {
        id: apiProduct.ID,
        name: apiProduct.name,
        price: apiProduct.priceModel.price.value
    }
    return product;
}