# Service Worker Plugin for SFRA

This is a repository for the inoffcial service worker plugin for Storefront Reference Architecture (SFRA) with basic PWA features

## Features
* PWA support including add-to-homescreen and accompanying UI changes such as backbutton and loading indicators
* Refresh Button to bypass cache for staging users
* fullpage client side page cache, based on serverside cache timing
* partial page cache for remote includes / limits traffic for global and shared page components
* customizable offline page

## How to
1. Clone this repository.
3. Create a dw.json connecting your sandbox including a client-id field for ocapi access
4. Run `npm run installonrefarch`
5. For handling client side compilation please use `https://github.com/SalesforceCommerceCloud/sfra-webpack-builder`

## Note
The build scripts are currently working for SFRA only - if you plan on using it with different site IDs please customize the build/ scripts, package.json and siteimport files

## License

Licensed under the current NDA and licensing agreement in place with your organization. (This is explicitly not open source licensing.)
