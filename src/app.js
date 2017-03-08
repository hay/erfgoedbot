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

function sendDelayedRandomizedSocialFeedback(recipientId) {
    setTimeout(function () {
        fb.sendTextMessage(recipientId, `${_.random(8, 50)} mensen zagen deze afbeelding ook, ${_.random(2, 4)} mensen kijken op dit moment`);
    }, 4000);
}


const handleSearchResponse = (recipientID) => (err, data) => {
    fb.sendTypingOff(recipientID);

    if (err) {
        fb.sendTextMessage(recipientID, err);
    } else {
        console.log(JSON.stringify(data, null, 2));
        if (data.type === 'buttons') {
            fb.sendButtonMessage(recipientID, data.buttons);
        }

        if (data.type === 'images') {
            fb.sendTextMessage(recipientID, `Je gaat zo zien: ${data.images.label}, ${data.images.description}`);
            fb.sendImageMessage(recipientID, data.images.image);
            setTimeout(function () {
                fb.sendURL(recipientID, `http://www.wikidata.org/wiki/${data.images.id}`);
            }, 3000);
            sendDelayedRandomizedSocialFeedback(recipientID);
        }

        if (data.type === 'text') {
            fb.sendTextMessage(recipientID, data.text);
        }
    }
};

const handleTextMessage = (messageText, senderID) => {
    const parsedMsg = messageText.trim().toLowerCase();
    fb.sendTextMessage(senderID, "Ik ben nu aan het zoeken, een momentje...");
    fb.sendTypingOn(senderID);

    if (parsedMsg.indexOf('-') !== -1) {
        const dates = parsedMsg.split('-');

        bot.painterByDate(dates[1], dates[0], handleSearchResponse(senderID));
    } else if (parsedMsg === 'utrecht') {
        bot.getMonuments(handleSearchResponse(senderID));
    } else if (parsedMsg === 'surprise') {
        bot.randomArtist(handleSearchResponse(senderID));
    } else {
        bot.searchPainters(parsedMsg, handleSearchResponse(senderID));
    }
};

const handleAttachments = (senderID) =>
    fb.sendTextMessage(senderID, "Sorry, dit snap ik even niet.");


const handlePostback = (senderID, payload) => {
    bot.paintingsByArtist(payload, (err, data) => {
        if (err) {
            fb.sendTextMessage(senderID, `Er ging iets mis: ${err}`);
        } else {
            if (data.type === 'images') {
                fb.sendTextMessage(senderID, `Je gaat zo zien: ${data.images.label}, ${data.images.description}`);
                fb.sendImageMessage(senderID, data.images.image);
                sendDelayedRandomizedSocialFeedback(senderID);
                console.log(data.images);

                if (data.images.collection) {
                    setTimeout(function () {
                        fb.sendTextMessage(senderID, `Dit kun je trouwens zien in de collectie van ${data.images.collection}`)
                        const moreUrl = data.images.url ? data.images.url : `http://www.wikidata.org/wiki/${data.images.id}`;
                        fb.sendURL(senderID, moreUrl);
                        fb.sendButtonMessage(senderID, {
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
    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
    fb.sendTextMessage(senderID, "Ik ben nu een schilderij aan het ophalen...");
};

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
                    fb.receivedMessage(messagingEvent, {
                        onTextMessage: handleTextMessage,
                        onAttachments: handleAttachments
                    });
                } else if (messagingEvent.delivery) {
                    fb.receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    fb.receivedPostback(messagingEvent, {
                        onPostback: handlePostback
                    });
                } else if (messagingEvent.read) {
                    fb.receivedMessageRead(messagingEvent);
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

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;