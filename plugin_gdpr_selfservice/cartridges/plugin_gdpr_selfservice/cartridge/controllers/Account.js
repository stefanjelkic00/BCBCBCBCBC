'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get('DeleteData',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var HookManager = require('dw/system/HookMgr');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var currentCustomer = req.currentCustomer.raw;

        // Initialize a default customer details object
        // This object is sent as parameter to the {app.account.deletecustomer.after} hook
        // and can be used to perform some logic after the deletion (i.e. send a confirmation email)
        var customerDetails = {
            email: currentCustomer.getProfile().getEmail(),
            firstName: currentCustomer.getProfile().getFirstName(),
            lastName: currentCustomer.getProfile().getLastName(),
        };

        // Fire the {app.account.deletecustomer.before} hook to allow other cartridge
        // to do some logic before to the deletion
        if (HookManager.hasHook('app.account.deletecustomer.before')) {
            var beforeHookResult = HookManager.callHook('app.account.deletecustomer.before',
                'beforeProcess',
                currentCustomer
            );

            // If a customerDetails object is sent back through the hook, let's merge it with the
            // default one from this script
            // It allows other cartridges to add customers details that will be sent to the
            // {app.account.deletecustomer.after} hook
            if (!empty(beforeHookResult) && !empty(beforeHookResult.customerDetails)) {
                Object.keys(beforeHookResult.customerDetails).forEach(function (key) {
                    customerDetails[key] = beforeHookResult.customerDetails[key];
                });
            }
        }

        /**
         * As per the docs, CustomerMgr.removeCustomerTrackingData() is doing the following
         * https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FDWAPI%2Fscriptapi%2Fhtml%2Fapi%2Fclass_dw_customer_CustomerMgr.html&cp=0_16_2_6_10&anchor=dw_customer_CustomerMgr_removeCustomerTrackingData_Customer_DetailAnchor
         *
         * Removes (asynchronously) tracking data for this customer (from external systems or data stores).
         * This will not remove the customer from the database, nor will it prevent tracking to start again
         * in the future for this customer. The customer is identified by login / email /customerNo / cookie
         * when its a registered customer, and by cookie when its an anonymous customer.
         */
        CustomerMgr.removeCustomerTrackingData(currentCustomer);

        Transaction.wrap(function () {
            /**
             * As per the docs, CustomerMgr.removeCustomer() is doing the following
             * https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FDWAPI%2Fscriptapi%2Fhtml%2Fapi%2Fclass_dw_customer_CustomerMgr.html&resultof=%22customermgr%22%20&anchor=dw_customer_CustomerMgr_removeCustomer_Customer_DetailAnchor
             *
             * Logs out the supplied customer and deletes the customer record.
             * The customer must be a registered customer and the customer must currently be logged in.
             * The customer must be logged in for security reasons to ensure that only the customer
             * itself can remove itself from the system. While logout the customers session is reset
             * to an anonymous session and, if present, the "Remember me" cookie of the customer is removed.
             * Deleting the customer record includes the customer credentials, profile, address-book
             * with all addresses, customer payment instruments, product lists and memberships in customer groups.
             * Orders placed by this customer won't be deleted. If the supplied customer is not a
             * registered customer or is not logged in, the API throws an exception
             */
            CustomerMgr.removeCustomer(currentCustomer);
        });

        // Default redirectUrl, used to redirect the customer once this controller is done
        var redirectUrl = URLUtils.home();

        // Fire the {app.account.deletecustomer.after} hook to allow other cartridge
        // to do some logic after to the deletion (i.e. send a confirmation email to the customer)
        if (HookManager.hasHook('app.account.deletecustomer.after')) {
            var afterHookResult = HookManager.callHook('app.account.deletecustomer.after',
                'afterProcess',
                customerDetails
            );

            // If a redirectUrl is sent back through the hook, override the default one
            // This can be used by other cartridge to redirect the customer to different page than
            // the home page (i.e a landing page that confirms the deletion to the customer)
            if (!empty(afterHookResult) && !empty(afterHookResult.redirectUrl)) {
                redirectUrl = afterHookResult.redirectUrl;
            }
        }

        res.redirect(redirectUrl);
        next();
    }
);

module.exports = server.exports();
