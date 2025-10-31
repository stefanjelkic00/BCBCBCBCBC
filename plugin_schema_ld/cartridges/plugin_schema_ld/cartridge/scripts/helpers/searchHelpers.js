'use strict';

const assign = require("modules/server/assign");

function search(req, res) {
    const CatalogMgr = require('dw/catalog/CatalogMgr');
    const URLUtils = require('dw/web/URLUtils');
    const ProductSearchModel = require('dw/catalog/ProductSearchModel');

    const pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    const ProductSearch = require('*/cartridge/models/search/productSearch');
    const reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    const schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

    let apiProductSearch = new ProductSearchModel();
    const maxSlots = 4;
    let categoryTemplate = '';
    let productSearch;
    let reportingURLs;

    const searchRedirect = req.querystring.q ? apiProductSearch.getSearchRedirect(req.querystring.q) : null;

    if (searchRedirect) {
        return { searchRedirect: searchRedirect.getLocation() };
    }

    apiProductSearch = module.superModule.setupSearch(apiProductSearch, req.querystring, req.httpParameterMap);
    apiProductSearch.search();

    if (!apiProductSearch.personalizedSort) {
        module.superModule.applyCache(res);
    }
    categoryTemplate = module.superModule.getCategoryTemplate(apiProductSearch);
    productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    pageMetaHelper.setPageMetaTags(req.pageMetaData, productSearch);

    const canonicalUrl = URLUtils.url('Search-Show', 'cgid', req.querystring.cgid);
    const refineurl = URLUtils.url('Search-Refinebar');
    const allowedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule', 'pmid'];
    let isRefinedSearch = false;

    Object.keys(req.querystring).forEach(function (element) {
        if (allowedParams.indexOf(element) > -1) {
            refineurl.append(element, req.querystring[element]);
        }

        if (['pmin', 'pmax'].indexOf(element) > -1) {
            isRefinedSearch = true;
        }

        if (element === 'preferences') {
            let i = 1;
            isRefinedSearch = true;
            Object.keys(req.querystring[element]).forEach(function (preference) {
                refineurl.append('prefn' + i, preference);
                refineurl.append('prefv' + i, req.querystring[element][preference]);
                i++;
            });
        }
    });

    if (productSearch.searchKeywords !== null && !isRefinedSearch) {
        reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }

    var result = {
        productSearch: productSearch,
        maxSlots: maxSlots,
        reportingURLs: reportingURLs,
        refineurl: refineurl,
        canonicalUrl: canonicalUrl,
        apiProductSearch: apiProductSearch
    };

    if (productSearch.isCategorySearch && !productSearch.isRefinedCategorySearch && categoryTemplate && apiProductSearch.category.parent.ID === 'root') {
        pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);
        result.category = apiProductSearch.category;
        result.categoryTemplate = categoryTemplate;
    }

    if (!categoryTemplate || categoryTemplate === 'rendering/category/categoryproducthits') {
        const productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
        const breadcrumbs = productHelpers.getAllBreadcrumbs(productSearch.category.id, null, []).reverse();
        breadcrumbs.pop();

        result.schemaData = [schemaHelper.getBreadcrumbsSchema(breadcrumbs), schemaHelper.getListingPageSchema(productSearch.productIds)];
    }

    return result;
}

module.exports = assign(module.superModule, {
    search: search
});
