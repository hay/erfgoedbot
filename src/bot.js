const wikidata = require('./wikidata.js');

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

function query(q, callback) {
    q = q.toLowerCase();

    wikidata.search(q, (err, data) => {
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

function searchPainters(q, callback) {
    wikidata.searchPainters(q, (err, data) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, {
                type : 'buttons',
                buttons : data
            });
        }
    });
}

function paintingsByArtist(id, callback) {
    wikidata.paintingsByArtist(id, (err, data) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, {
                type : 'images',
                images : data
            });
        }
    });
}

module.exports = { query, paintingsByArtist, searchPainters, painterByDate };