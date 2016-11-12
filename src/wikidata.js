const request = require('request');

function paintingsByArtist(id, cb) {
    const ENDPOINT = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=select%20%3Fitem%20%3Fimage%20%3FitemLabel%20%3FitemDescription%20%3Flocation%20where%20%7B%20%0A%20%20%20%20%3Fitem%20wdt%3AP31%20wd%3AQ3305213%20.%20%0A%20%20%20%20%3Fitem%20wdt%3AP170%20wd%3A${id}%20.%0A%20%20%20%20%3Fitem%20wdt%3AP18%20%3Fimage%20.%0A%20%20%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%2Cnl%22%20%7D%0A%7D`;

    request(ENDPOINT, (err, res, body) => {
        if (err) {
            cb(err, null);
        }

        var paintings = JSON.parse(body).results.bindings.slice(0, 3).map((p) => {
            return {
                "image" : p.image.value,
                "label" : p.itemLabel.value,
                "description" : p.itemDescription.value
            };
        });

        cb(null, paintings);
    });
}

function search(q, cb) {
    q = q.toLowerCase();

    const ENDPOINT = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${q}&format=json&language=en&uselang=en&type=item`;

    request(ENDPOINT, (err, res, body) => {
        var data = JSON.parse(body).search.slice(0, 3).map((item) => {
            return {
                title : item.description,
                payload : item.id
            };
        });

        if (err) {
            cb(err, null);
        } else {
            cb(null, {
                text : `Welke ${q} bedoel je?`,
                data : data
            });
        }
    })
}

module.exports = { search, paintingsByArtist };