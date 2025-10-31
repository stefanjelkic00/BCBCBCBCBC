
import loader from './Loader';
import ImageUtils from './ImageUtils';
import IDBUtils from './IDBUtils';
import CacheUtils from './CacheUtils';

class PwaUtils {

    constructor() {
        const imageUtils = new ImageUtils();
        const idbUtils = new IDBUtils();
        const cacheUtils = new CacheUtils();
        imageUtils.initImageLazyLoad();
        idbUtils.storePagePartialsInIndexedDB();
        cacheUtils.checkCacheInvalidation();

        this.standAloneModeLoadingIndicator();

        // sends the main request to the service worker, so we know on ajax where
        // the request came from.
        // @todo check if referred can be used instead
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                command: 'setUrl',
                message: window.location.href
            });
        }
        // since we have a shared HTML head accross all pages, we get the title
        // from a hidden element and set it as document title
        if (document.querySelector('span.contextheader[data-pagetitle]')) {
            document.title = document.querySelector('span.contextheader[data-pagetitle]').dataset.pagetitle;
        }
    }

    standAloneModeLoadingIndicator() {
        if (navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
            // since we have no visible addressbar customer doesn't see a page load
            // hence we show loading spinner on page unload for normal browsers
            // and on anchor click for ios, since there is no beforeunload
            var isOnIOS = navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i);
            if (!isOnIOS) {
                window.addEventListener('beforeunload', function () {
                    setTimeout(function () { loader.start(); }, 100);
                    // stop spinner in case page was unloaded without navigation event
                    setTimeout(function () { loader.stop(); }, 700);
                });
            } else {
                var body = document.querySelector('body');
                var anchors = 'a:not([onclick])';

                body.addEventListener('click', function (event) {
                    var closest = event.target.closest(anchors);
                    if (closest && body.contains(closest)) {
                        loader.start();
                        // a bit dumb, but since we don't know wether the anchor triggers an ajax or not
                        // we hide the loading indicator again
                        setTimeout(function () { loader.stop(); }, 400);
                    }
                });
            }
        }
    }
}

export default PwaUtils;
