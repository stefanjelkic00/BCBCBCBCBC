
class IDBUtils {

    /**
     * Recreates IDB
     * @param {Object} event The first number.
     */
    recreateDBStores(event) {
        const openDB = event.target;
        let existingStores = openDB.result.objectStoreNames;
        if (existingStores) {
            Array.from(existingStores).forEach(openDB.result.deleteObjectStore);
        }
        let cacheStore = openDB.result.createObjectStore('caches', { keyPath: 'cachekey' });
        cacheStore.createIndex('context, contextid', ['context', 'contextid']);

        let urlStore = openDB.result.createObjectStore('urlmapping', { keyPath: 'url' });
        urlStore.createIndex('contextid', 'contextid', { unique: false });
    }

    storePagePartialsInIndexedDB() {
        var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
        var openDB = indexedDB.open('PartialPageCache');
        openDB.onupgradeneeded = this.recreateDBStores;

        openDB.onerror = function (event) {
            console.error(event);// eslint-disable-line no-console
        };
        openDB.onblocked = function (event) {
            console.error(event);// eslint-disable-line no-console
        };

        openDB.onsuccess = function () {
            var cacheables = Array.from(document.getElementsByClassName('swcache'));
            var contextMapping = {};
            var urlTransaction = openDB.result.transaction('urlmapping', 'readonly');
            var urlStore = urlTransaction.objectStore('urlmapping');
            // first we check if we have a cache context for current site
            // i.e. if we are in the mens category, the service worker stored us
            // contextid=search and context={cgid:'mens'}
            urlStore.get(window.location.href).onsuccess = function (urlMappingEvent) {
                if (urlMappingEvent.srcElement.result) {
                    contextMapping = JSON.parse(urlMappingEvent.srcElement.result.contextid);
                }

                var tx = openDB.result.transaction('caches', 'readwrite');
                var store = tx.objectStore('caches');
                // loop over swcache elements
                cacheables.forEach(function (element) {
                    // if we have sub elements with actual content
                    if (element.childElementCount > 0) {
                        var contextid = '';
                        if (contextMapping.context === element.dataset.swcachecontext) {
                            contextid = contextMapping.contextid;
                        }
                        // calculate cache lifetime, stored on element in format '24h'
                        var cacheTime = element.dataset.swcachetime;
                        var maxLifeTimeValue = cacheTime.replace(/\D+/g, '');
                        var maxLifeTimeUnit = cacheTime.indexOf('h') > -1 ? 'hours' : 'minutes';
                        var now = new Date().getTime();
                        var invalidationTime = 0;
                        // supports hours and minutes, with minutes being the default
                        if (maxLifeTimeUnit === 'hours') {
                            invalidationTime = now + (maxLifeTimeValue * 60 * 60 * 1000);
                        } else {
                            invalidationTime = now + (maxLifeTimeValue * 60 * 1000);
                        }

                        // parse URLs from element, which mark a partial stale
                        // i.e. newsletter signup in footer should be hidden after registration
                        // putting the newsletter signeup url here, causes the cache to be reloaded
                        // after newsletter has been signed up
                        var clearOnUrls = element.dataset.swclearonurl ? JSON.parse(element.dataset.swclearonurl) : [];

                        // construct storable object
                        var item = {
                            cachekey: element.dataset.swcachekey,
                            content: element.innerHTML,
                            context: element.dataset.swcachecontext,
                            contextid: contextid,
                            invalidationTime: invalidationTime,
                            clearOnUrls: clearOnUrls
                        };
                        store.put(item);
                    }
                });
                return tx.complete;
            };

            (function boilerPlate() {
                urlTransaction.oncomplete = function () {
                    openDB.result.close();
                };

                urlTransaction.onabort = function () {
                    openDB.result.close();
                };

                urlTransaction.onerror = function () {
                    openDB.result.close();
                };
            }());
        };
    }

}

export default IDBUtils;
