var offlineUrl = self.serverConstructedUrls.offlineUrl;
var headerUrl = self.serverConstructedUrls.headerUrl;
var shell = self.serverConstructedUrls.shell;

self.addEventListener('install', function (event) {
    self.skipWaiting();
    var installPromise = new Promise(async function (resolve) {
        let offlineCache = await caches.open('offline');
        let clearUrls = [];
        let skipHeader = [];
        offlineCache.addAll([offlineUrl]);
        let mainCache = await caches.open('v1');
        let headerResponse = await fetch(headerUrl);
        headerResponse.headers.forEach(function (value, headername) {
            if (headername === 'x-sf-cc-cacheclearurls') {
                clearUrls = JSON.parse(value);
            }
            if (headername === 'x-sf-cc-skipheader') {
                skipHeader = JSON.parse(value);
            }
        });
        var clearHeaderUrls = await caches.open('clearers');
        clearUrls.forEach(element => {
            clearHeaderUrls.put(element, new Response('true'));
        });

        var skipHeaderUrls = await caches.open('skippers');
        skipHeader.forEach(element => {
            skipHeaderUrls.put(element, new Response('true'));
        });
        var headerBodyText = await headerResponse.text();
        var newResponse = new Response(headerBodyText.replace(/\$swcached\$/g, 'true'));
        mainCache.put(headerUrl, newResponse);
        var result = await mainCache.addAll(shell);
        resolve(result);
    });
    event.waitUntil(installPromise);
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim().then(function () {
        // See https://developer.mozilla.org/en-US/docs/Web/API/Clients/matchAll
        return self.clients.matchAll({ type: 'window' });
    }));
});

self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf(this.location.origin) === 0 && event.request.url.indexOf('demandware.servlet') === -1 && event.request.url.indexOf('/s/-/dw/data/') === -1 && event.request.url.indexOf('/dw/bm/v1') === -1 && event.request.url.indexOf('/Sites-Site/') === -1 && event.request.url.indexOf('/__Analytics-Start') === -1 && event.request.url.indexOf('__SYSTEM__') === -1) {
        if (event.request.url.indexOf('demandware.static') === -1) {
            if (event.request.mode !== 'cors' && event.request.cache !== 'reload') {
                // page requests respond with stream
                event.respondWith(self.pagepartials.createPageStream(event.request, event));
            } else {
                var ajaxPromise = new Promise(async function (resolve) {
                    var response = await self.pagepartials.generatePageResponse(event);
                    var clearHeaderUrls = await caches.open('clearers');
                    var hitUrlWhichUpdatesHeaderCache = await clearHeaderUrls.match(event.request.url);
                    if (hitUrlWhichUpdatesHeaderCache) {
                        var mainCache = await caches.open('v1');
                        await mainCache.add(headerUrl);
                    }
                    resolve(response);
                });
                // cors / ajax respond with response
                event.respondWith(ajaxPromise);
            }
        } else if (event.request.url.indexOf('.css') !== -1
                || event.request.url.indexOf('.js') !== -1
                || event.request.url.indexOf('.svg') !== -1
                || event.request.url.indexOf('.png') !== -1
                || event.request.url.indexOf('.jpg') !== -1
                || event.request.url.indexOf('.woff2') !== -1) {
            event.respondWith(
                caches.open('v1').then(function (cache) {
                    return cache.match(event.request).then(function (response) {
                        // add expires handling here?
                        if (response && event.request.cache !== 'reload') {
                            return response;
                        }
                        return fetch(event.request).then(function (freshresponse) {
                            cache.put(event.request, freshresponse.clone());
                            return freshresponse;
                        });
                    });
                })
            );
        }
    }
});

self.addEventListener('message', function (event) {
    var data = event.data;

    if (data.command === 'setUrl') {
        self.currentFullPageUrl = data.message;
    }

    if (data.command === 'canLazyLoadImages') {
        self.canLazyLoadImages = data.message;
    }
});
