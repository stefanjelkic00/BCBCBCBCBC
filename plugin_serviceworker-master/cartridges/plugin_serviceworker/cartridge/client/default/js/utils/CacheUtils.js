
class CacheUtils {

    invalidateCache() {
        if (caches) {
            caches.delete('v1');
        }
        var clearingDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
        var clearingOpenDB = clearingDB.open('PartialPageCache');
        clearingOpenDB.onsuccess = function () {
            var urlTransaction = clearingOpenDB.result.transaction('urlmapping', 'readwrite');
            var urlStore = urlTransaction.objectStore('urlmapping');
            urlStore.clear().onsuccess = function () {
                var tx = clearingOpenDB.result.transaction('caches', 'readwrite');
                var store = tx.objectStore('caches');
                store.clear().onsuccess = function () {
                    clearingOpenDB.result.close();
                };
            };
        };
    }

    async checkCacheInvalidation() {
        // if page was reloaded (can't distinguish between hard and soft) we clear all caches
        if (window.performance && window.performance.navigation && window.performance.navigation.type === PerformanceNavigation.TYPE_RELOAD) {
            this.invalidateCache();
        } else {
            var urlElement = document.querySelector('link[rel=fetch-cache-hash]');
            var url = urlElement ? urlElement.getAttribute('href') : null;
            // get cache from server
            if (url) {
                var cacheHashResponse = await fetch(url);
                var cacheInfo = await cacheHashResponse.json();
                // if local hash is different from remote hash, clear the cache
                if (localStorage.swCacheHash && localStorage.swCacheHash !== cacheInfo.hash) {
                    this.invalidateCache();
                }
                // and store remote hash as new local hash
                localStorage.swCacheHash = cacheInfo.hash;
            }
        }
    }
}
export default CacheUtils;
