'use strict';

const path = require('path');

/**
 * Allows to configure aliases for you require loading
 */
module.exports.aliasConfig = {
	// enter all aliases to configure

    alias: {
        base: path.resolve(
			process.cwd(), // eslint-disable-next-line max-len
			'./cartridges/plugin_serviceworker/cartridge/client/default/'
		)
    }
};

/**
 * Exposes cartridges included in the project
 */
module.exports.cartridges = [
    './cartridges/plugin_serviceworker'
];
