const wikidata = require('./wikidata.js');
const _ = require('lodash');

function randomArtist(callback) {
    wikidata.randomArtist((err, data) => {
        if (err) {
            handlePainters(err, null, callback);
        } else {
            data.data = [_.sample(data.data)];
            handlePainters(err, data, callback);
        }
    });
}

function painterByDate(month, day, callback) {
    wikidata.painterByDate(month, day, (err, data) => {
        if (!data || data.length === 0) {
            callback('Geen resultaten gevonden', null);
        } else {
            callback(null, {
                type : 'buttons',
                buttons : data
            });
        }
    });
}

function getMonuments(callback) {
    wikidata.getMonuments((err, data) => {
        handleImages(err, data,callback);
    });
}

function handlePainters(err, data, callback) {
    if (err) {
        callback(err, null);
    } else {
        callback(null, {
            type : 'buttons',
            buttons : data
        });
    }
}

function searchPainters(q, callback) {
    wikidata.searchPainters(q, (err, data) => {
        handlePainters(err, data, callback);
    });
}

function handleImages(err, data, callback) {
    if (err) {
        callback(err, null);
    } else {
        callback(null, {
            type : 'images',
            images : data
        });
    }
}

function paintingsByArtist(id, callback) {
    wikidata.paintingsByArtist(id, (err, data) => {
        handleImages(err, data, callback);
    });
}

module.exports = {  paintingsByArtist, searchPainters, painterByDate, getMonuments, randomArtist };