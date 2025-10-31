var offlineUrl = self.serverConstructedUrls.offlineUrl;
var headerUrl = self.serverConstructedUrls.headerUrl;

import { utils } from './service-worker.utils';
import { openDb } from './service-worker.idb';

self.wrappedDb = { openDb: openDb };

self.pagepartials = { // eslint-disable-line no-unused-vars
    createPageStream: function createPageStream(request, event) {
        const stream = new ReadableStream({
            start(controller) {
                /**
                 * Starts streaming the response in a asynchronous function
                 */
                async function startAsync() {
                    // the body url is the request url plus 'include'
                    const url = new URL(request.url);
                    url.searchParams.append('swskipheader', 'true');

                    var clearingUrls = await caches.open('clearers');
                    // for instance after add to cart we want to reload the page header
                    var hitUrlWhichReloadsHeader = await clearingUrls.match(request.url);
                    var cache = await caches.open('v1');
                    if (hitUrlWhichReloadsHeader) {
                        await cache.delete(headerUrl);
                        await utils.reloadHeader(headerUrl, cache);
                    }

                    var skipUrls = await caches.open('skippers');
                    var hitUrlWhichSkipsHeader = await skipUrls.match(request.url);
                    var headerServedFromCache = false;
                    if (!hitUrlWhichSkipsHeader) {
                        var headerResponse = await cache.match(headerUrl);
                        if (!headerResponse) {
                            headerResponse = await utils.reloadHeader(headerUrl, cache);
                        } else {
                            headerServedFromCache = true;
                        }
                        // put header onto response stream
                        await utils.pushOnStream(headerResponse.body, controller);
                    }
                    // get the main page response, without the header
                    var mainResponse = await self.pagepartials.generatePageResponse(event, headerServedFromCache);
                    // put main response onto response stream

                    await utils.pushOnStream(mainResponse.body, controller);
                    controller.close();
                }
                startAsync();
            }
        });
        var streamedResponse = new Response(stream, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
        return streamedResponse;
    },

    generatePageResponse: function (event, alreadycached) {
        var contextUrl = event.request.url;
        if (event.request.mode !== 'navigate') {
            contextUrl = self.currentFullPageUrl;
        }

        var promise = new Promise(function (resolve) {
            /**
             * Opens the indexed db
             * @returns {*} opened db context
             */
            function openPartialPageCacheDB() {
                return self.wrappedDb.openDb('PartialPageCache', 1, utils.recreateDBStores);
            }
            /**
             * main logic, put in async function so it allows await and the list
             */
            async function startAsyncFlow() {
                var request = event.request;
                // these array will be subsequently filled by the indexed db cursor
                var cacheEntries = [];
                var entriesToDelete = [];
                // used to control wether we store the response in the cache.
                // Will be set to true if we encounter an error or if we served the response by the cache already
                var skipCache = false;
                var storeInCache = true;
                try {
                    var db = await openPartialPageCacheDB();
                    const transaction = db.transaction('urlmapping');
                    // the url store contains a mapping from url to context such as search and a subcontext like category jewellery
                    var urlContextResult = await transaction.objectStore('urlmapping').get(contextUrl).then(result => result);
                    var contextMapping;
                    if (urlContextResult) {
                        contextMapping = JSON.parse(urlContextResult.contextid);
                    } else {
                        contextMapping = { context: 'nocontext', contextid: 'nocontextid' };
                    }

                    // First we get the partial cache entries, which are visible on all pages
                    // e.g the menu, mini cart etc.
                    const globalPartialCacheTransaction = db.transaction('caches');
                    globalPartialCacheTransaction.objectStore('caches').index('context, contextid').openCursor(IDBKeyRange.only(['global', ''])).then(function cursorIterate(globalCursor) {
                        if (globalCursor) {
                            var shouldBeCleared = false;
                            // the cache entries can carry a flag which forces them to be refreshed if we encounter a specific url
                            // e.g. the minicart cache entry is revoked, when the addToCart ajax URL is called
                            globalCursor.value.clearOnUrls.forEach(function (element) {
                                if (event.request.url.indexOf(element) > -1) {
                                    shouldBeCleared = true;
                                }
                            });
                            // either we delete the entry or tell the commerce cloud server about our cache entries
                            if (shouldBeCleared) {
                                entriesToDelete.push(globalCursor.value);
                            } else if (cacheEntries.length < 50) {
                                cacheEntries.push(globalCursor.value);
                            }
                            // continue the loop until we have found everything
                            globalCursor.continue().then(cursorIterate);
                        }
                    });
                    await globalPartialCacheTransaction.complete;

                    // Second we get the partial cache entries, which are visible on some pages
                    // e.g. the black tie and the gray tie in the ties category.
                    const contextPartialCacheTransaction = db.transaction('caches');
                    contextPartialCacheTransaction.objectStore('caches').index('context, contextid').openCursor(IDBKeyRange.only([contextMapping.context, contextMapping.contextid])).then(function cursorIterate(contextCursor) {
                        if (contextCursor && cacheEntries.length < 50) {
                            cacheEntries.push(contextCursor.value);
                            contextCursor.continue().then(cursorIterate);
                        }
                    });

                    await contextPartialCacheTransaction.complete;

                    var deleteTransaction = db.transaction('caches', 'readwrite');
                    var deleteStore = deleteTransaction.objectStore('caches');
                    entriesToDelete.forEach(function (entry) {
                        deleteStore.delete(entry.cachekey);
                    });
                } catch (e) {
                    if (console) {
                        // eslint-disable-next-line no-console
                        console.error('Indexed DB unavailable', e);
                    }
                }

                try {
                    // once all cached partials are gathered
                    // change request url based on what the client knows
                    // i.e. if header menu is available on client, the server doesn't have to deliver it
                    var newURL = utils.buildPartialSkipUrl(event, cacheEntries);
                    if (event.request.method === 'GET') {
                        request = new Request(newURL);
                    }
                } catch (e) {
                    skipCache = true;
                    if (console) {
                        console.error('error on creating server request', e); // eslint-disable-line no-console
                    }
                }

                // checks cache if request is already stored and active
                let cache = await caches.open('v1');
                var cacheURL = utils.buildCacheableURL(event, cacheEntries);
                var cacheRequest = new Request(cacheURL);
                var response = await cache.match(cacheRequest);
                if (response !== undefined && !utils.isCacheExpired(response) && !skipCache && request.cache !== 'reload') {
                    storeInCache = false;
                } else {
                    try {
                        var freshresponse = await fetch(request);
                        // workaround as response headers for navigate event are only available here, not in the document
                        utils.storeHttpHeaderInDB(event.request.url, freshresponse);
                        response = freshresponse;
                    } catch (e) {
                        storeInCache = false;
                        // if we don't have an even expired response from the cache, we show the offline page
                        if (!response) {
                            var offlinecache = await caches.open('offline');
                            response = await offlinecache.match(offlineUrl);
                        }
                    }
                }
                if (request.method !== 'GET') {
                    resolve(response);
                } else {
                    // process markup and recreate response
                    let body = await response.text();
                    // cache response and deliver to the browser
                    var isCacheable = false;
                    response.headers.forEach(function (v, k) {
                        if (k === 'x-sf-cc-cachetime') {
                            isCacheable = true;
                        }
                    });
                    var init = utils.createResponseSkeleton(response);
                    var oldResponse = new Response(body.replace(/\$swcached\$/g, 'true'), init);
                    if (isCacheable && storeInCache) {
                        let v1cache = await caches.open('v1');
                        v1cache.put(cacheRequest, oldResponse);
                    }
                    // replace any partial cache placeholders with their full cached values
                    var newbody = utils.replacePartialPlaceholder(body, cacheEntries, alreadycached);
                    response = new Response(newbody, init);

                    resolve(response);
                }
            }

            startAsyncFlow();
        });
        return promise;
    }
};


self.addEventListener('message', function (event) {
    var data = event.data;

    if (data.command === 'setUrl') {
        self.currentFullPageUrl = data.message;
    }
});
