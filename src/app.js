/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
'use strict';

const fs = require('fs');

const config = fs.existsSync('config/production.json')
    ? JSON.parse(fs.readFileSync('config/production.json', 'utf-8'))
    : {
        "appSecret": process.env.MESSENGER_APP_SECRET,
        "pageAccessToken": process.env.MESSENGER_PAGE_ACCESS_TOKEN,
        "validationToken": process.env.MESSENGER_VALIDATION_TOKEN,
        "serverURL": process.env.SERVER_URL,
        "pathPrefix": "",
        "port": process.env.PORT
    };

const fb = require("./fb/fb-lib")(config);

const
    bodyParser = require('body-parser'),
    express = require('express'),
    https = require('https'),
    request = require('request'),
    bot = require('./bot.js'),
    _ = require('lodash');



const PATH_PREFIX = config.pathPrefix;

const app = express();
app.set('port', config.port);
app.set('view engine', 'ejs');
app.use(bodyParser.json({verify: fb.verifyRequestSignature}));
app.use(PATH_PREFIX, express.static('public'));


// Validate webhook
app.get(`${PATH_PREFIX}/webhook`, fb.validateWebhook);

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post(`${PATH_PREFIX}/webhook`, function (req, res) {
    const data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function (pageEntry) {

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function (messagingEvent) {
                if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                    fb.receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    receivedPostback(messagingEvent);
                } else if (messagingEvent.read) {
                    receivedMessageRead(messagingEvent);
                } else {
                    console.log("Webhook received unimplemented messagingEvent: ", messagingEvent);
                }
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
    }
});

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event) {
    const senderID = event.sender.id;
    const recipientID = event.recipient.id;
    const timeOfMessage = event.timestamp;
    const message = event.message;

    console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    const isEcho = message.is_echo;
    const messageId = message.mid;
    const appId = message.app_id;
    const metadata = message.metadata;
    const quickReply = message.quick_reply;

    if (isEcho) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
        return;
    } else if (quickReply) {
        const quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
        sendTextMessage(senderID, "Quick reply tapped");
        return;
    }

    function handleSearchResponse(err, data) {
        fb.sendTypingOff(senderID);

        if (err) {
            sendTextMessage(senderID, err);
        } else {
            console.log(data);
            if (data.type === 'buttons') {
                sendButtonMessage(senderID, data.buttons);
            }

            if (data.type === 'images') {
                sendTextMessage(senderID, `Je gaat zo zien: ${data.images.label}, ${data.images.description}`);
                sendImageMessage(senderID, data.images.image);
                setTimeout(function () {
                    sendURL(senderID, `http://www.wikidata.org/wiki/${data.images.id}`);
                }, 3000);
            }

            if (data.type === 'text') {
                sendTextMessage(senderID, data.text);
            }
        }
    }

    // You may get a text or attachment but not both
    const messageText = message.text;

    // Currently the only type we support is text
    if (messageText) {
        const parsedMsg = messageText.trim().toLowerCase();
        sendTextMessage(senderID, "Ik ben nu aan het zoeken, een momentje...");
        fb.sendTypingOn(senderID);


        if (parsedMsg.indexOf('-') !== -1) {
            const dates = parsedMsg.split('-');

            bot.painterByDate(dates[1], dates[0], handleSearchResponse);
        } else if (parsedMsg === 'utrecht') {
            bot.getMonuments(handleSearchResponse);
        } else if (parsedMsg === 'surprise') {
            bot.randomArtist(handleSearchResponse);
        } else {
            bot.searchPainters(parsedMsg, handleSearchResponse);
        }
    } else {
        sendTextMessage(senderID, "Sorry, dit snap ik even niet.");
    }

    return;
}




/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
    const senderID = event.sender.id;
    const recipientID = event.recipient.id;
    const timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    const payload = event.postback.payload;

    bot.paintingsByArtist(payload, (err, data) => {
        if (err) {
            sendTextMessage(senderID, `Er ging iets mis: ${err}`);
        } else {
            if (data.type === 'images') {
                sendTextMessage(senderID, `Je gaat zo zien: ${data.images.label}, ${data.images.description}`);
                sendImageMessage(senderID, data.images.image);
                console.log(data.images);

                if (data.images.collection) {
                    setTimeout(function () {
                        sendTextMessage(senderID, `Dit kun je trouwens zien in de collectie van ${data.images.collection}`)
                        const moreUrl = data.images.url ? data.images.url : `http://www.wikidata.org/wiki/${data.images.id}`;
                        sendURL(senderID, moreUrl);
                        sendButtonMessage(senderID, {
                            text: "Nog een werk van deze schilder?",
                            data: [{
                                title: "Ja, leuk!",
                                payload: data.images.author
                            }]
                        })
                    }, 5000);
                }
            }
        }
    });


    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
    sendTextMessage(senderID, "Ik ben nu een schilderij aan het ophalen...");
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
    // All messages before watermark (a timestamp) or sequence have been seen.
    const watermark = event.read.watermark;
    const sequenceNumber = event.read.seq;

    console.log("Received message read event for watermark %d and sequence " +
        "number %d", watermark, sequenceNumber);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId, url) {
    url = `${url}?width=800`;

    fb.callSendAPI({
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: 'image',
                payload: {
                    url: url
                }
            }
        }
    });

    setTimeout(function () {
        sendTextMessage(recipientId, `${_.random(8, 50)} mensen zagen deze afbeelding ook, ${_.random(2, 4)} mensen kijken op dit moment`);
    }, 4000);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    fb.callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId, buttons) {
    const data = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    "template_type": "button",
                    "text": buttons.text,
                    buttons: buttons.data.map((b) => {
                        return {
                            type: "postback",
                            title: b.title,
                            payload: b.payload
                        }
                    })
                }
            }
        }
    };

    fb.callSendAPI(data);
}

function sendURL(recId, url) {
    fb.callSendAPI({
        recipient: {
            id: recId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    "template_type": "button",
                    "text": 'Wil je meer weten?',
                    buttons: [{
                        type: "web_url",
                        url: url,
                        title: "Lees verder"
                    }]
                }
            }
        }
    })
}


// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;