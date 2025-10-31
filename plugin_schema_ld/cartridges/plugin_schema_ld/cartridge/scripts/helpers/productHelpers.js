'use strict';

const assign = require("modules/server/assign");

function showProductPage(querystring, reqPageMetaData) {
    const URLUtils = require('dw/web/URLUtils');
    const ProductFactory = require('*/cartridge/scripts/factories/product');
    const pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    const structuredDataHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

    const params = querystring;
    const product = ProductFactory.get(params);
    const addToCartUrl = URLUtils.url('Cart-AddProduct');
    const canonicalUrl = URLUtils.url('Product-Show', 'pid', product.id);
    const breadcrumbs = module.superModule.getAllBreadcrumbs(null, product.id, []).reverse();

    let template = 'product/productDetails';

    if (product.productType === 'bundle' && !product.template) {
        template = 'product/bundleDetails';
    } else if (product.productType === 'set' && !product.template) {
        template = 'product/setDetails';
    } else if (product.template) {
        template = product.template;
    }

    pageMetaHelper.setPageMetaData(reqPageMetaData, product);
    pageMetaHelper.setPageMetaTags(reqPageMetaData, product);
    const schemaData = [
        structuredDataHelper.getProductSchema(product),
        structuredDataHelper.getBreadcrumbsSchema(breadcrumbs)
    ]

    return {
        template: template,
        product: product,
        addToCartUrl: addToCartUrl,
        resources: module.superModule.getResources(),
        breadcrumbs: breadcrumbs,
        canonicalUrl: canonicalUrl,
        schemaData: schemaData
    };
}


module.exports = assign(module.superModule, {
    showProductPage: showProductPage
});
