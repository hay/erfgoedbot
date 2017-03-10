const _ = require('lodash');
const queries = require('./queries.js');

function getMonuments(callback) {
    const q = queries.monuments("Q803");

    queries.query(q).then((data) => {
        handleImages(data, callback);
    });
}

function painterByDate(month, day, cb) {
    const q = queries.painterByDate(month, day);

    queries.query(q).then((data) => {
        data = data.results.bindings.map((item) => {
            return {
                title : item.entityLabel.value,
                payload : item.entity.value.replace('http://www.wikidata.org/entity/', '')
            };
        });

        cb(null, {
            text : `Deze schilders zijn geboren op ${day}-${month}. Kies er een.`,
            data : data
        });
    });
}

function handleImages(data, cb, authorId) {
    authorId = authorId || null;

    if (!data.results.bindings || data.results.bindings.length === 0) {
        cb("Sorry, daar kan ik geen schilderijen van vinden.", null);
        return;
    }

    const p = _.sample(data.results.bindings);

    const result = {
        image: `${p.image.value}?width=800`,
        label: p.itemLabel.value,
        description: p.itemDescription.value,
        id: p.item.value.replace('http://www.wikidata.org/entity/', ''),
        author: authorId
    };

    result.collection = p.collectionLabel ? p.collectionLabel.value : null;
    result.url = p.described ? p.described.value : null;

    cb(null, result);
}

function paintingsByArtist(id, cb) {
    const q = queries.paintingsByArtist(id);

    queries.query(q).then((data) => {
        handleImages(data, cb, id);
    });
}

function handlePainters(data, cb, limit) {
    limit = limit || 3;

    if (!data.results.bindings || data.results.bindings.length === 0) {
        cb("Sorry, ik kan geen schilders vinden die zo heten.", null);
    } else {
        data = data.results.bindings.slice(0, limit).map((item) => {
            return {
                title : item.itemLabel.value,
                payload : item.item.value.replace('http://www.wikidata.org/entity/', '')
            };
        }).sort(function(a, b) {
            return parseInt(a.payload.slice(1)) < parseInt(b.payload.slice(1)) ? -1 : 1;
        });

        cb(null, {
            text : `Welke van deze schilders wil je hebben?`,
            data : data
        });
    }
}

function searchPainters(q, cb) {
    q = queries.searchPainters(q.toLowerCase());

    queries.query(q).then((data) => {
        handlePainters(data, cb);
    });
}

function randomArtist(cb) {
    q = queries.randomArtist();

    queries.query(q).then((data) => {
        handlePainters(data, cb, 100);
    });
}

module.exports = { paintingsByArtist, searchPainters, painterByDate, getMonuments, randomArtist };