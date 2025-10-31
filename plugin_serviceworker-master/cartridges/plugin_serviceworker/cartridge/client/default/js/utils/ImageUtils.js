

class ImageUtils {

    initImageLazyLoad() {
        var canLazyLoadImages = false;
        if (('IntersectionObserver' in window) && ('MutationObserver' in window)) {
            // called on ready
            this.imageLazyLoad();
            // and when new elements such as images are added to the DOM
            var mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach(() => {
                    this.imageLazyLoad();
                });
            });
            var config = { attributes: false, childList: true, characterData: false };
            mutationObserver.observe(document.body, config);
            canLazyLoadImages = true;
        }
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                command: 'canLazyLoadImages',
                message: canLazyLoadImages
            });
        }
    }

    imageLazyLoad() {
        let lazyImages = [].slice.call(document.querySelectorAll('img[data-lazysrc]'));
        const options = { rootMargin: '100px' };
        let lazyImageObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var lazyImage = entry.target;
                    if (lazyImage.getAttribute('data-lazysrc')) {
                        lazyImage.src = lazyImage.getAttribute('data-lazysrc');
                        lazyImage.removeAttribute('data-lazysrc');
                        lazyImageObserver.unobserve(lazyImage);
                    }
                }
            });
        }, options);
        lazyImages.forEach(function (lazyImage) {
            lazyImageObserver.observe(lazyImage);
        });
    }
}

export default ImageUtils;
