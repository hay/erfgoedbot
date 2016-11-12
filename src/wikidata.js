const request = require('request');
const _ = require('lodash');

function getMonuments(callback) {
    const ENDPOINT = 'https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=SELECT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3Fimage%20WHERE%20%7B%0A%20%20%3Fitem%20wdt%3AP1435%20wd%3AQ916333%20.%0A%20%20%3Fitem%20wdt%3AP131%20wd%3AQ803%20.%0A%20%20%3Fitem%20wdt%3AP18%20%3Fimage%20.%0A%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22nl%22.%20%7D%0A%7D%20LIMIT%20100';

    request(ENDPOINT, (err, res, body) => {
        if (err) {
            cb(err, null);
        }

        handleImages(body, callback);
    });
}

function painterByDate(month, day, cb) {
    console.log(month, day);

    const ENDPOINT = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=PREFIX%20xsd%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0A%0ASELECT%20%3Fentity%20(YEAR(%3Fdate)%20AS%20%3Fyear)%20%3FentityLabel%20WHERE%20%7B%0A%20%20%3Fentity%20wdt%3AP31%20wd%3AQ5.%0A%20%20%3Fentity%20wdt%3AP106%20wd%3AQ1028181.%0A%20%20%3Fentity%20wdt%3AP569%20%3Fdate.%0A%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%2Cnl%22.%20%7D%0A%20%20FILTER(((DATATYPE(%3Fdate))%20%3D%20xsd%3AdateTime)%20%26%26%20((MONTH(%3Fdate))%20%3D%20${month})%20%26%26%20((DAY(%3Fdate))%20%3D%20${day}))%0A%7D%0ALIMIT%203`;

    request(ENDPOINT, (err, res, body) => {
        if (err) {
            cb(err, null);
        }

        var data = JSON.parse(body);

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

function handleImages(body, cb) {
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
}

function paintingsByArtist(id, cb) {
    const ENDPOINT = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=select%20%3Fitem%20%3Fimage%20%3FitemLabel%20%3FitemDescription%20%3Flocation%20where%20%7B%20%0A%20%20%20%20%3Fitem%20wdt%3AP31%20wd%3AQ3305213%20.%20%0A%20%20%20%20%3Fitem%20wdt%3AP170%20wd%3A${id}%20.%0A%20%20%20%20%3Fitem%20wdt%3AP18%20%3Fimage%20.%0A%20%20%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%2Cnl%22%20%7D%0A%7D`;

    request(ENDPOINT, (err, res, body) => {
        if (err) {
            cb(err, null);
        }

        handleImages(body, cb);
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

module.exports = { search, paintingsByArtist, searchPainters, painterByDate, getMonuments };