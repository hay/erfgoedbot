const crypto = require('crypto'),
    https = require('https'),
    request = require('request');

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
    // App Secret can be retrieved from the App Dashboard
    const APP_SECRET = config.appSecret;
    // Generate a page access token for your page from the App Dashboard
    const PAGE_ACCESS_TOKEN = config.pageAccessToken;

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


    /*
     * Call the Send API. The message data goes in the body. If successful, we'll
     * get the message id in a response
     *
     */
    function callSendAPI(messageData) {
        if (process.env.MODE === 'mock') {
            console.log(JSON.stringify(messageData, null, 2));
            return;
        }

        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: messageData

        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                const recipientId = body.recipient_id;
                const messageId = body.message_id;

                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s", messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s", recipientId);
                }
                console.log("Message data was:", JSON.stringify(messageData, null, 2));
                console.log("=====\n\n")

            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
                console.error("Message data was:", JSON.stringify(messageData, null, 2));
                console.error("=====\n\n")
            }
        });
    }

    /*
     * Turn typing indicator on
     *
     */
    function sendTypingOn(recipientId) {
        console.log("Turning typing indicator on");

        const messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        callSendAPI(messageData);
    }

    /*
     * Turn typing indicator off
     *
     */
    function sendTypingOff(recipientId) {
        console.log("Turning typing indicator off");

        const messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        callSendAPI(messageData);
    }

    /*
     * Verify that the callback came from Facebook. Using the App Secret from
     * the App Dashboard, we can verify the signature that is sent with each
     * callback in the x-hub-signature field, located in the header.
     *
     * https://developers.facebook.com/docs/graph-api/webhooks#setup
     *
     */
    function verifyRequestSignature(req, res, buf) {
        const signature = req.headers["x-hub-signature"];

        if (!signature) {
            // For testing, let's log an error. In production, you should throw an
            // error.
            console.error("Couldn't validate the signature.");
        } else {
            const elements = signature.split('=');
            const method = elements[0];
            const signatureHash = elements[1];

            const expectedHash = crypto.createHmac('sha1', APP_SECRET)
                .update(buf)
                .digest('hex');

            if (signatureHash != expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    function receivedDeliveryConfirmation(event) {
        const delivery = event.delivery;
        const messageIDs = delivery.mids;
        const watermark = delivery.watermark;
        if (messageIDs) {
            messageIDs.forEach(function (messageID) {
                console.log("Received delivery confirmation for message ID: %s",
                    messageID);
            });
        }

        console.log("All message before %d were delivered.", watermark);
    }



    return {
        validateWebhook: validateWebhook,
        sendTypingOn: sendTypingOn,
        sendTypingOff: sendTypingOff,
        callSendAPI: callSendAPI,
        verifyRequestSignature: verifyRequestSignature,

        receivedDeliveryConfirmation: receivedDeliveryConfirmation
    }
};