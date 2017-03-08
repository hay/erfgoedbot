/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


module.exports = (config) => {

    // Arbitrary value used to validate a webhook
    const VALIDATION_TOKEN = config.validationToken;

    /*
     * Use your own validation token. Check that the token used in the Webhook
     * setup is the same token used here.
     *
     */
    function validateWebhook(req, res) {
        if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === VALIDATION_TOKEN) {
            console.log("Validating webhook");
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error("Failed validation. Make sure the validation tokens match.");
            res.sendStatus(403);
        }
    }

    return {
        validateWebhook: validateWebhook
    }
};