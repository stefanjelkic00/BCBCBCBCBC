
var utils = { // eslint-disable-line no-unused-vars
   /**
    * Creates new response options object inclucing new cache headers
    * @param {Response} freshresponse response object jeust fetched from server
    * @return {Object} init object to pass to Response constructor
    */
    createResponseSkeleton: function createResponseSkeleton(freshresponse) {
        var init = {
            status: freshresponse.status,
            statusText: freshresponse.statusText,
            headers: { 'X-ServedByServiceWorker': 'true' }
        };

        freshresponse.headers.forEach(function (v, k) {
            init.headers[k] = v;
        });

        if (init.headers['x-sf-cc-cachetime']) {
            var numbers = init.headers['x-sf-cc-cachetime'].replace(/\D+/g, '');
            var unit = init.headers['x-sf-cc-cachetime'].indexOf('h') > -1 ? 'hours' : 'minutes';

            var now = new Date().getTime();
            var invalidationTime = 0;
            if (unit === 'hours') {
                invalidationTime = now + (numbers * 60 * 60 * 1000);
            } else {
                invalidationTime = now + (numbers * 60 * 1000);
            }
            init.headers['x-sf-cc-cache-validto'] = invalidationTime;
        }
        return init;
    },

    /**
    * replaces placeholders from server with actual cached content
    * @param {string} body the original response body trasnferred from server
    * @param {array} cacheEntries the full cached objects
    * @param {boolean} alreadycached in case the partial partila is already cached
    * @return {string} the string containing final markup
    */
    replacePartialPlaceholder: function replacePartialPlaceholder(body, cacheEntries, alreadycached) {
        var newbody = body;
        var partialPageCacheUsed;
        for (var i = 0; i < cacheEntries.length; i++) {
            var replaceSource = '$sw' + cacheEntries[i].cachekey + '$';
            if (newbody.indexOf(replaceSource) > -1) {
                partialPageCacheUsed = true;
            }
            newbody = newbody.replace(replaceSource, cacheEntries[i].content);
        }
        if (self.canLazyLoadImages) {
            newbody = newbody.replace(/(<img.*?\s)src=(?:'|")([^'">]+)(?:'|")/g, '$1 src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-lazysrc="$2"');
        }
        if (partialPageCacheUsed || alreadycached) {
            newbody = newbody.replace(/\$swcached\$/g, 'true');
        }

        return newbody;
    },

    /**
     * reads from stream and puts result onto given controller usually from
     * other stream to stitch together multiple streams
     * @param {*} stream the stream used to serve the response
     * @param {*} controller the controller serving the response
     * @returns {Promise} the promise to deliver  the response
     */
    pushOnStream: function pushOnStream(stream, controller) {
        const reader = stream.getReader();

        return reader.read().then(function process(result) {
            if (result.done) return;
            controller.enqueue(result.value);
            // eslint-disable-next-line consistent-return
            return reader.read().then(process);
        });
    },

    /**
     *  Reloads the page header into the cache and returns response
     * @param {string} headerUrl the url used to retrieve the header
     * @param {Cache} cache the cache which stored the page header
     * @returns {*} the header HTML
     */
    reloadHeader: async function reloadHeader(headerUrl, cache) {
        var headerResponse = await fetch(headerUrl);
        var clone = headerResponse.clone();
        var text = await clone.text();
        var newResponse = new Response(text.replace(/\$swcached\$/g, 'true'));
        cache.put(headerUrl, newResponse);
        return headerResponse;
    },

    /**
    * check wether cache is expired or not
    * @param {Response} response response retrieved from browser cache
    * @return {boolean} true if cache is older then required from server
    */
    isCacheExpired: function isCacheExpired(response) {
        var cacheValidTo = 0;
        response.headers.forEach(function (v, k) {
            if (k === 'x-sf-cc-cache-validto') {
                cacheValidTo = v;
            }
        });
        return cacheValidTo <= Date.now();
    },

    /**
    * Adds URL parameter to original url, which tells the server to skip partials which are already available on the client
    * @param {FetchEvent} swfetchevent the database event returned on getting all cache entries
    * @param {array} cacheEntries the entries available in cache
    * @returns {string} the enhanced URL
    */
    buildPartialSkipUrl: function buildPartialSkipUrl(swfetchevent, cacheEntries) {
        var newURL = swfetchevent.request.url;

        if (swfetchevent.request.method === 'GET' && swfetchevent.request.cache !== 'reload') {
            var skipParameters = [];
            skipParameters.push('swskipheader', 'true');
            var now = (new Date()).getTime();
            for (var i = 0; i < cacheEntries.length; i++) {
                if (cacheEntries[i].invalidationTime > now) {
                    skipParameters.push('sw' + cacheEntries[i].cachekey + '=skip');
                }
            }
            newURL = swfetchevent.request.url + (swfetchevent.request.url.indexOf('?') > -1 ? '&' : '?') + skipParameters.join('&');
        }
        return newURL;
    },
    /**
    * Creates URLs which will be used as a cache key. It will include partial page skips
    * which need to be replaced by certain URLs, but ignore static skips as it doesn't matter
    * if we cache the full markup or the placeholders
    * @param {FetchEvent} swfetchevent the database event returned on getting all cache entries
    * @param {array} cacheEntries the entries available in cache
    * @returns {string} the enhanced URL
    */
    buildCacheableURL: function buildCacheableURL(swfetchevent, cacheEntries) {
        var newURL = swfetchevent.request.url;
        if (swfetchevent.request.method === 'GET' && swfetchevent.request.cache !== 'reload') {
            var skipParameters = [];
            skipParameters.push('swskipheader', 'true');
            var now = (new Date()).getTime();
            for (var i = 0; i < cacheEntries.length; i++) {
                if (cacheEntries[i].invalidationTime > now && cacheEntries[i].clearOnUrls.length > 0) {
                    skipParameters.push('sw' + cacheEntries[i].cachekey + '=skip');
                }
            }
            newURL = swfetchevent.request.url + (swfetchevent.request.url.indexOf('?') > -1 ? '&' : '?') + skipParameters.join('&');
        }
        return newURL;
    },

    /**
    * onupgradeneeded call for PartialCache-DB
    * @param {IDBOpenDBRequest} request the request opened on the database
    */
    recreateDBStores: function recreateDBStores(request) {
        var openDB = request.result || { result: request };

        var existingStores = openDB.result.objectStoreNames;

        Array.from(existingStores).forEach(openDB.result.deleteObjectStore);

        var cacheStore = openDB.result.createObjectStore('caches', { keyPath: 'cachekey' });
        cacheStore.createIndex('context, contextid', ['context', 'contextid']);

        var urlStore = openDB.result.createObjectStore('urlmapping', { keyPath: 'url' });
        urlStore.createIndex('contextid', 'contextid', { unique: false });
    },
    /**
    *
    * @param {string} url The orginal request url
    * @param {Response} response the response served by the server
    */
    storeHttpHeaderInDB: function storeHttpHeaderInDB(url, response) {
        var openDB = indexedDB.open('PartialPageCache');
        openDB.onupgradeneeded = this.recreateDBStores;

        openDB.onsuccess = function () {
            try {
                var tx = openDB.result.transaction('urlmapping', 'readwrite');
                var store = tx.objectStore('urlmapping');
                var contextid = '';
                response.headers.forEach(function (value, headername) {
                    if (headername === 'x-sf-cc-cachecontext') {
                        contextid = value;
                    }
                });
                if (contextid) {
                    var item = {
                        url: url,
                        contextid: contextid
                    };
                    store.put(item);
                }
            } catch (e) {
                if (console) {
                    console.error('Cannot write URL mapping to indexed DB', e); // eslint-disable-line no-console
                }
            }
            openDB.result.close();
        };
    }
};

exports.utils = utils;
