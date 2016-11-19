const rp = require('request-promise');
const _ = require('lodash');
const queries = require('./queries.js');

function query(q) {
    const ENDPOINT = `
        https://query.wikidata.org/bigdata/namespace/wdq/sparql
        ?format=json&query=${encodeURIComponent(q)}
    `;

    return rp({
        uri : ENDPOINT,
        json : true
    });
}

function getMonuments(callback) {
    const q = queries.monuments("Q803");

    query(q).then((data) => {
        handleImages(data, callback);
    });
}

function painterByDate(month, day, cb) {
    const q = queries.painterByDate(month, day);

    query(q).then((data) => {
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

    var p = _.sample(data.results.bindings);

    var data = {
        image : p.image.value,
        label : p.itemLabel.value,
        description : p.itemDescription.value,
        id : p.item.value.replace('http://www.wikidata.org/entity/', ''),
        author : authorId
    };

    data.collection = p.collectionLabel ? p.collectionLabel.value : null;
    data.url = p.described ? p.described.value : null;

    cb(null, data);
}

function paintingsByArtist(id, cb) {
    const q = queries.paintingsByArtist(id);

    query(q).then((data) => {
        handleImages(data, cb, id);
    });
}

function handlePainters(data, cb) {
    if (!data.results.bindings || data.results.bindings.length === 0) {
        cb("Sorry, ik kan geen schilders vinden die zo heten.", null);
    } else {
        data = data.results.bindings.slice(0, 3).map((item) => {
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

    query(q).then((data) => {
        handlePainters(data, cb);
    });
}

function randomArtist(cb) {
    q = queries.randomArtist();

    query(q).then((data) => {
        handlePainters(data, cb);
    });
}

module.exports = { paintingsByArtist, searchPainters, painterByDate, getMonuments, randomArtist };