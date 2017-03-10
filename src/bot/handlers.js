module.exports = (fb) => {

    const
        search = require('./search.js'),
        gvn = require('./gvn'),
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

    const handlePostbackResponse = (recipientId) => (err, data) => {
        if (err) {
            fb.sendTextMessage(recipientId, `Er ging iets mis: ${err}`);
        } else {
            console.log("---- building postback from ---");
            console.log(JSON.stringify(data, null, 2));
            console.log("---- / building postback from ---");
            if (data.type === 'images') {
                fb.sendTextMessage(recipientId, `Je gaat zo zien: ${data.images.label}, ${data.images.description}`);
                fb.sendImageMessage(recipientId, data.images.image);
                sendDelayedRandomizedSocialFeedback(recipientId);
                if (data.images.collection) {
                    setTimeout(function () {
                        fb.sendTextMessage(recipientId, `Dit kun je trouwens zien in de collectie van ${data.images.collection}`)
                        const moreUrl = data.images.url ? data.images.url : `http://www.wikidata.org/wiki/${data.images.id}?width=800`;
                        fb.sendURL(recipientId, moreUrl);
                        fb.sendButtonMessage(recipientId, {
                            text: `Nog een werk van ${data.images.subjectName || "deze schilder"}?`,
                            data: [{
                                title: "Ja, leuk!",
                                payload: data.images.author
                            }]
                        })
                    }, 5000);
                }
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
            const searchPainters = () => search.searchPainters(parsedMsg, handleSearchResponse(senderID));
            if(_.random(true, false)) {
                searchPainters();
            } else {
                gvn.search(parsedMsg, {onSuccess: handleSearchResponse(senderID), onError: searchPainters});
            }

        }
    };

    const onAttachments = (senderID) =>
        fb.sendTextMessage(senderID, "Sorry, dit snap ik even niet.");


    const onPostback = (senderID, payload) => {

        if(payload.charAt(0) === 'Q') {
            search.paintingsByArtist(payload, handlePostbackResponse(senderID));

            fb.sendTextMessage(senderID, "Ik ben nu een schilderij aan het ophalen...");
        } else if(payload.match(/^GVN/)) {
            gvn.imageByFacet(payload, handlePostbackResponse(senderID));
            fb.sendTextMessage(senderID, "Ik ben nu een beeld aan het ophalen...");
        }
    };

    return {
        onAttachments: onAttachments,
        onPostback: onPostback,
        onTextMessage: onTextMessage
    }
};