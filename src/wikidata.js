const request = require('request');
const _ = require('lodash');

function paintingsByArtist(id, cb) {
    const ENDPOINT = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=select%20%3Fitem%20%3Fimage%20%3FitemLabel%20%3FitemDescription%20%3Flocation%20where%20%7B%20%0A%20%20%20%20%3Fitem%20wdt%3AP31%20wd%3AQ3305213%20.%20%0A%20%20%20%20%3Fitem%20wdt%3AP170%20wd%3A${id}%20.%0A%20%20%20%20%3Fitem%20wdt%3AP18%20%3Fimage%20.%0A%20%20%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%2Cnl%22%20%7D%0A%7D`;

    request(ENDPOINT, (err, res, body) => {
        if (err) {
            cb(err, null);
        }

        var data = JSON.parse(body);

        if (!data.results.bindings || data.results.bindings.length === 0) {
            cb("Sorry, daar kan ik geen schilderijen van vinden.", null);
            return;
        }

        var p = _.sample(data.results.bindings);

        cb(null, {
            image : p.image.value,
            label : p.itemLabel.value,
            description : p.itemDescription.value
        });
    });
}

function searchPainters(q, cb) {
    q = encodeURIComponent(q.toLowerCase());

    const ENDPOINT = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=select%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20where%20%7B%20%0A%09%3Fitem%20wdt%3AP31%20wd%3AQ5%3B%20wdt%3AP106%20wd%3AQ1028181%3B%20rdfs%3Alabel%20%3Flabel%20.%0A%09FILTER(%20LANG(%3Flabel)%20%3D%20%22nl%22%20)%20.%0A%09FILTER(%20CONTAINS(LCASE(%3Flabel)%2C%20%22${q}%22)%20)%20.%0A%09SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22nl%22%20%7D%20.%0A%7D`;

    request(ENDPOINT, (err, res, body) => {
        var data = JSON.parse(body);

        if (!data.results.bindings || data.results.bindings.length === 0) {
            cb("Sorry, ik kan geen schilders vinden die zo heten.", null);
        } else {
            data = data.results.bindings.slice(0, 3).map((item) => {
                return {
                    title : item.itemLabel.value,
                    payload : item.item.value.replace('http://www.wikidata.org/entity/', '')
                };
            });

            cb(null, {
                text : `Welke van deze schilders wil je hebben?`,
                data : data
            });
        }
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

module.exports = { search, paintingsByArtist, searchPainters };