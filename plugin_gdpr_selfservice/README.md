# plugin_gdpr_selfservice: Storefront Reference Architecture (SFRA)

This is the repository for the plugin_gdpr_selfservice plugin. This plugin enhances the app_storefront_base cartridge by providing GDPR functionalities.
As per the [B2C Commerce documentation](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FDataProtectionAndPrivacy%2FDataProtectionAndPrivacy.html&resultof=%22gdpr%22%20), the GDPR protection and regulation give you guidance on some of the common privacy principles:

* Data deletion: which is included in this cartridge
* Consent Management: which is already included in the app_storefront_base cartridge through the [ConsentTracking.js controller](https://github.com/SalesforceCommerceCloud/storefront-reference-architecture/blob/master/cartridges/app_storefront_base/cartridge/controllers/ConsentTracking.js) and [consentTracking.js middleware](https://github.com/SalesforceCommerceCloud/storefront-reference-architecture/blob/master/cartridges/app_storefront_base/cartridge/scripts/middleware/consentTracking.js).
* Data Portability: this is included in the [plugin_datadownload](https://github.com/SalesforceCommerceCloud/plugin_datadownload) plugin compatible with SFRA.
* Restriction of Processing: this is a combination of both "Data deletion" and "Data portability" items.

This plugin aims to remove the customer and the following objects from the B2C Commerce platform:
* customer record
* customer credentials
* customer profile
* address-book with all addresses
* customer payment instruments
* customer product lists
* memberships in customer groups
* tracking data

This plugin will not remove the following objects from the B2C Commerce platform:
* Orders
* Any custom object created that may contain personal data from the customer
* Anything that has been exported to another system outside of the B2C Commerce platform

Thus, the plugin has been built with two hooks, fired before and after the customer deletion, to allow you to perform additional logic in case you need to remove more data yourself.
Be aware that you have to handle the data deletion of previously stated objects yourself to be compliant with the GDPR regulation.


# Cartridge Path Considerations
The plugin_gdpr_selfservice plugin requires the app_storefront_base cartridge. In your cartridge path, include the cartridges in the following order:

```
plugin_gdpr_selfservice:app_storefront_base
```

# Hooks

This plugin comes with two hooks, fired before and after the customer deletion.
Those hooks are there for you to be able to perform additional logic during the deletion process.

Hook name | Parameter | Return value | Description
--------------------------------- | ---------------------------------------| -------------------------------- | --------------------------------
app.account.deletecustomer.before | `currentCustomer` {dw/customer/Customer} | You can provide a `customerDetail` object that contain attributes to send to the app.account.deletecustomer.after hook | This parameter is the current authenticated customer.
app.account.deletecustomer.after  | `customerDetails` {Object}               | You can provide a `redirectUrl` that will be used to redirect the customer to a page after the deletion. By default, the customer is redirected to the homepage. | This parameter is an object that contains the customer's email, first name and last name. It allows you to use this details one last time to perform any action (i.e. send a confirmation email to the customer)

# Template Structure

As the customer needs to see a button to delete his/her related data in the My Account section, a template has been introduced in this cartridge.

# Getting Started

1. Clone this repository. (The name of the top-level folder is plugin_gdpr_selfservice.)
2. Include the plugin_gdpr_selfservice cartridge in the cartridge path
3. Upload the cartridge on your instance
4. Add the template to the page where you want to display the button. Please note that the customer has to be authenticated to perform a data deletion, so the template has to be included in a page protected by the customer's login.