const ProductFactory = require('*/cartridge/scripts/factories/product');
const Product = require('*/cartridge/models/gtm/product');

const siteCurrency = session.currency.currencyCode;

const PAGE_TYPES = {
    HomePage: 'home',
    ProductPage: 'product',
    ProductListPage: 'plp',
    Wishlist: 'wishlist',
    Checkout: 'checkout'
}

function callNext(next) {
    if (next) {
        next();
    }
}

function pushGTMEvents(res, events) {
    res.setViewData({
        gtmEvents: (res.viewData.gtmEvents || []).concat(events)
    });
}

const GTM = {
    PAGE_TYPE: PAGE_TYPES,

    setProductAddedToCart: function(req, res, next) {
        if (!empty(res.viewData.cart)) {
            const products = [];
            const pid = req.form.pid;

            if (!empty(pid)) {
                const product = new Product(ProductFactory.get({pid: pid}));
                product.quantity = req.form ? parseInt(req.form.quantity, 10): 1;
                products.push(product);
            }

            const BasketMgr = require('dw/order/BasketMgr');
            const basket = BasketMgr.getCurrentBasket();

            const cartEvent = {
                'event': 'addToCart',
                'ecommerce': {
                    'currencyCode': siteCurrency,
                    'add': {
                        'products': products
                    }
                },
                'cartValue': basket.adjustedMerchandizeTotalPrice.value
            };
            pushGTMEvents(res, [cartEvent]);
        }

        callNext(next);
    },

    setProductRemovedFromCart: function (req, res, next) {
        const pid = req.querystring.pid;

        if (!empty(pid)) {
            const products = [];

            const product = new Product(ProductFactory.get({ pid: pid }));
            product.quantity = req.form ? parseInt(req.form.quantity, 10) : 1;
            products.push(product);

            const BasketMgr = require('dw/order/BasketMgr');
            const basket = BasketMgr.getCurrentBasket();

            const cartEvent = {
                'event': 'removeFromCart',
                'ecommerce': {
                    'currencyCode': siteCurrency,
                    'remove': {
                        'products': products
                    }
                },
                'cartValue': basket.adjustedMerchandizeTotalPrice.value
            };
            pushGTMEvents(res, [cartEvent]);

        }

        callNext(next);
    },

    setStartingQuantity: function(req, res, next) {
        const BasketMgr = require('dw/order/BasketMgr');
        const basket = BasketMgr.getCurrentBasket();

        const item = basket.getProductLineItems(req.querystring.pid);

        session.custom.eventType = item[0].quantity < req.querystring.quantity ? 'addToCart' : 'removeFromCart';

        callNext(next);
    },

    setUpdatedLineItemProductQuantity: function(req, res, next) {
        const BasketMgr = require('dw/order/BasketMgr');
        const basket = BasketMgr.getCurrentBasket();

        const products = [];
        const pid = req.querystring.pid;

        if (!empty(pid)) {
            const product = new Product(ProductFactory.get({pid: pid}));
            product.quantity = req.form ? parseInt(req.querystring.quantity, 10): 1;
            products.push(product);

            const eventType = session.custom.eventType;

            const cartEvent = {
                'event' : eventType,
                'ecommerce': {
                    'currencyCode': siteCurrency
                },
                'cartValue': basket.adjustedMerchandizeTotalPrice.value
            }

            cartEvent.ecommerce[eventType.slice(0, eventType.search(/[A-Z]/g))] = {products: products};
            delete session.custom.eventType;

            pushGTMEvents(res, [cartEvent]);
        }

        callNext(next);
    },

    setProductTileDetails: function (req, res, next) {
        const product = res.viewData.product;

        if (product.productType !== 'bundle') {
            const gtmTileProduct = new Product(ProductFactory.get({pid: product.id}));
            res.setViewData({
                'gtmTileProductDetails': JSON.stringify(gtmTileProduct)
            });
        }

        callNext(next);
    },

    setCheckoutData: function (req, res, next) {

        const items = res.viewData.order.items.items;

        const gtmData = {
            'event': 'checkoutStep',
            'ecommerce': {
                'currencyCode': siteCurrency,
                'checkout': {
                    'actionField': {
                        'step': res.viewData.currentStage
                    },
                    'products': items.map(function(item) {return new Product(ProductFactory.get({pid: item.id}))})
                }
            }
        }

        pushGTMEvents(res, [gtmData]);

        callNext(next);
    },

    setCouponAdded: function(req, res, next) {
        const BasketMgr = require('dw/order/BasketMgr');
        const basket = BasketMgr.getCurrentBasket();

        const hasCouponCode = basket.couponLineItems.toArray().some(function (couponLineItem) {
            return couponLineItem.couponCode === req.querystring.couponCode;
        })

        if (hasCouponCode) {
            const gtmEvent = {
                'event': 'promo_code_entered',
                'properties': {
                    'promoCode': req.querystring.couponCode
                }
            };

            pushGTMEvents(res, [gtmEvent]);
        }

        callNext(next);
    },

    setPurchaseData: function (req, res, next) {
        const order = res.viewData.order;

        if(!empty(order)) {
            const items = order.items.items || null;
            if (!items) {
                return callNext(next);
            }

            const products = items.map(function (item) {
                const gtmProduct = new Product(ProductFactory.get({ pid: item.id }), true);
                gtmProduct.quantity = item.quantity;
                return gtmProduct;
            });

            const gtmPurchaseData = {
                'event': 'purchase',
                'ecommerce': {
                    'currencyCode': siteCurrency,
                    'purchase': {
                        'actionField': {
                            'id': order.orderNumber,
                            'revenue': parseFloat(order.totals.grandTotal.replace(/[^\d\.]/g, '')).toFixed(2),
                            'tax': parseFloat(order.totals.totalTax.replace(/[^\d\.]/g, '') || 0).toFixed(2),
                            'shipping': parseFloat(order.totals.totalShippingCost.replace(/[^\d\.]/g, '') || 0).toFixed(2)
                        },
                        'products': products
                    }
                },
                'discount': order.totals.orderLevelDiscountTotal.value,
                'shippingCountry': order.shipping[0].shippingAddress.countryCode.value
            }

            pushGTMEvents(res, [gtmPurchaseData]);

        }

        callNext(next);
    },

    setProductDetails: function (req, res, next) {

        if (!empty(res.viewData.product)) {
            const product = new Product(res.viewData.product);

            const productDetailEvent = {
                'event': 'productDetail',
                'ecommerce': {
                    'currencyCode': siteCurrency,
                    'detail': {
                        'products': [product]
                    }
                }
            }

            pushGTMEvents(res, [productDetailEvent]);
        }

        callNext(next);
    },

    /**
     * Utility BIND to use this as middleware and inject data in controller middlware chain
     */
    bind: function (fn) {
        const targetFn = this[fn];
        const params = Array.prototype.slice.call(arguments).slice(1); // passed params without function name
        return function () {
            targetFn.apply(GTM, params.concat(Array.prototype.slice.call(arguments))); // Middleware chain params
        };
    }
}

module.exports = GTM;
