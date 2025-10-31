$(document).on('ajaxSuccess', function(event, response, ajaxSettings) {
    if ($('script[js-hook-gtm]').length > 0) {
        const viewData = JSON.parse(response.responseText);
        if (viewData.gtmEvents) {
            window.dataLayer = window.dataLayer || [];
            viewData.gtmEvents.forEach(function(event) {
                window.dataLayer.push(event);
            });
        }
    }
});
