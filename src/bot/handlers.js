module.exports = (fb) => {

    const
        search = require('./search.js'),
        _ = require('lodash');

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

    const onTextMessage = (messageText, senderID) => {
        const parsedMsg = messageText.trim().toLowerCase();
        fb.sendTextMessage(senderID, "Ik ben nu aan het zoeken, een momentje...");
        fb.sendTypingOn(senderID);

        if (parsedMsg.indexOf('-') !== -1) {
            const dates = parsedMsg.split('-');

            search.painterByDate(dates[1], dates[0], handleSearchResponse(senderID));
        } else if (parsedMsg === 'utrecht') {
            search.getMonuments(handleSearchResponse(senderID));
        } else if (parsedMsg === 'surprise') {
            search.randomArtist(handleSearchResponse(senderID));
        } else {
            search.searchPainters(parsedMsg, handleSearchResponse(senderID));
        }
    };

    const onAttachments = (senderID) =>
        fb.sendTextMessage(senderID, "Sorry, dit snap ik even niet.");


    const onPostback = (senderID, payload) => {
        search.paintingsByArtist(payload, (err, data) => {
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

        fb.sendTextMessage(senderID, "Ik ben nu een schilderij aan het ophalen...");
    };

    return {
        onAttachments: onAttachments,
        onPostback: onPostback,
        onTextMessage: onTextMessage
    }
};