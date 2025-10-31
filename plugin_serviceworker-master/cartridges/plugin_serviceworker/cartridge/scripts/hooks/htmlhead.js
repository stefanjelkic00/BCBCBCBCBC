var ISML = require('dw/template/ISML');

/**
 * Implements the html head hook to allow adding global javascript for service worker and partial cache gathering
 */
function htmlHead() {
    ISML.renderTemplate('pwa-utils-blocking');
}

module.exports = {
    htmlHead: htmlHead
};
