'use strict';

import PwaUtils from './utils/PwaUtils';
import CacheUtils from './utils/CacheUtils';


/**
 * Main entry point for application
 */
class Main {

    constructor() {
        window.pwa = window.pwa || {};
        const cacheUtils = new CacheUtils();
        var isStandalone = navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        document.documentElement.classList.add('pwa');
        var headerBannerStatus = window.sessionStorage.getItem('hide_header_banner');
        if (!headerBannerStatus || headerBannerStatus < 0) {
            document.documentElement.classList.add('show-callout-bar');
        }
        if (window.pwa.servedFromCache || isStandalone) {
            document.documentElement.classList.add('show-header-bar');
            if (isStandalone) {
                document.documentElement.classList.add('pwa-standalone');
                document.addEventListener('click', (event) => {
                    if (event.target.matches('#pwaback')) {
                        window.history.back();
                    }
                });
            }
            if (window.pwa.servedFromCache) {
                document.documentElement.classList.add('pwa-from-cache');

                document.addEventListener('click', (event) => {
                    if (event.target.matches('#pwareloadcache')) {
                        cacheUtils.invalidateCache();
                        location.reload(true);
                    }
                });
            }
        }
    }

    initPWA() {
        new PwaUtils(); // eslint-disable-line
    }
}

const mainApp = new Main();

// As we load asynchronously, we either listen to the domloaded event or call domready if it is finished loading
if (document.readyState !== 'loading') {
    mainApp.initPWA();
} else {
    document.addEventListener('DOMContentLoaded', mainApp.initPWA, false);
}
