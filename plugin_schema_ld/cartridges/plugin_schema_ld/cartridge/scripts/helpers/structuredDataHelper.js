'use strict';

const assign = require("modules/server/assign");
const URLUtils = require('dw/web/URLUtils');

/**
 * Get product schema information
 * @param {Object} product - Product Object
 *
 * @returns {Object} - Product Schema object
 */
function getProductSchema(product) {
    if (typeof product === 'undefined' || product === null) {
        return [];
    }

    const schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        '@id': URLUtils.abs('Product-Show', 'pid', product.id).toString(),
        name: product.productName,
        description: product.longDescription,
        productID: product.id
    };

    if (product.images) {
        schema.image = !empty(product.images[0]) && !empty(product.images[0].large[0]) ? product.images[0].large[0].absURL : '';
    }

    if (product.brand) {
        schema.brand = {
            '@type': 'Brand',
            name: product.brand
        };
    }

    if (product.price) {
        schema.offers = {
            'url': URLUtils.url('Product-Show', 'pid', product.id).toString(),
            'priceCurrency': session.currency.currencyCode
        };
        if (product.price.type === 'range') {
            schema.offers['@type'] = 'AggregateOffer';
            schema.offers.lowprice = !empty(product.price.min.sales) ? product.price.min.sales.value : !empty(product.price.min.list) ? product.price.min.list.value : '';
            schema.offers.highprice = !empty(product.price.max.sales) ? product.price.max.sales.value : !empty(product.price.max.list) ? product.price.max.list.value : '';
        } else {
            schema.offers['@type'] = 'Offer';
            if (product.price.sales) {
                schema.offers.price = product.price.sales.decimalPrice || '';
            } else if (product.price.list) {
                schema.offers.price = product.price.list.decimalPrice || '';
            }
        }
        schema.offers.itemCondition = 'https://schema.org/NewCondition'; // other item condition options: https://schema.org/OfferItemCondition
        schema.offers.availability = 'https://schema.org/InStock'; // other availability options: https://schema.org/ItemAvailability

    }

    return schema;

}

function getBreadcrumbsSchema(breadcrumbs) {

    if (empty(breadcrumbs)) {
        return [];
    }

    const breadcrumbsSchema = breadcrumbs.map(function (breadcrumb, index) {
        return {
            "@type": "ListItem",
            "position": index + 1,
            "name": breadcrumb.htmlValue,
            "item": breadcrumb.url.https().toString()
        }
    });

    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbsSchema
    };

    return schema;
}

/**
 * Get product listing page schema information
 * @param {List} productIds - Product Ids
 *
 * @returns {Object} - Listing Schema object
 */
function getListingPageSchema(productIds) {
    const ProductFactory = require('*/cartridge/scripts/factories/product');
    const schema = [];

    Object.keys(productIds).forEach(function (item) {
        let pid = productIds[item].productID;
        const product = ProductFactory.get({ pid: pid, pview: 'productTile' });
        const productImageURL = !empty(product.images[0]) && !empty(product.images[0].large[0]) ? product.images[0].large[0].absURL : '';
        const listPageSchema = {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            'name': product.productName,
            'image': productImageURL,
            'offers': {
                'url': URLUtils.abs('Product-Show', 'pid', product.id).toString(),
                'priceCurrency': session.currency.currencyCode
            }
        }
        if (product.price.type === 'range') {
            listPageSchema.offers['@type'] = 'AggregateOffer';
            listPageSchema.offers.lowprice = !empty(product.price.min.sales) ? product.price.min.sales.value : !empty(product.price.min.list) ? product.price.min.list.value : '';
            listPageSchema.offers.highprice = !empty(product.price.max.sales) ? product.price.max.sales.value : !empty(product.price.max.list) ? product.price.max.list.value : '';
        } else {
            listPageSchema.offers['@type'] = 'Offer';
            if (product.price.sales) {
                listPageSchema.offers.price = product.price.sales.decimalPrice || '';
            } else if (product.price.list) {
                listPageSchema.offers.price = product.price.list.decimalPrice || '';
            }
        }
        schema.push(listPageSchema);
    });
    return schema;
}

function getOtherSchema() {
    const url = 'https://' + request.httpHost;
    
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': '', // Brand name
        'url': url,
        'logo': '', // Brand logo url
        'sameAs': [ 
            /* List of URLs that that indicate the brand's identity (wikipedia, official brand site, social media sites etc.) */
        ]
    };

    return [schema];
}

module.exports = assign(module.superModule, {
    getProductSchema: getProductSchema,
    getBreadcrumbsSchema: getBreadcrumbsSchema,
    getListingPageSchema: getListingPageSchema,
    getOtherSchema: getOtherSchema
});
