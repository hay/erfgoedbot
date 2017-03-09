const rp = require('request-promise');

function monuments(location) {
    return `
        SELECT ?item ?itemLabel ?itemDescription ?image WHERE {
          ?item wdt:P1435 wd:Q916333 .
          ?item wdt:P131 wd:${location} .
          ?item wdt:P18 ?image .
          SERVICE wikibase:label { bd:serviceParam wikibase:language "nl". }
        } LIMIT 100
    `;
}

function painterByDate(month, day) {
    return `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?entity (YEAR(?date) AS ?year) ?entityLabel WHERE {
      ?entity wdt:P31 wd:Q5.
      ?entity wdt:P106 wd:Q1028181.
      ?entity wdt:P569 ?date.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl". }
      FILTER(((DATATYPE(?date)) = xsd:dateTime) && ((MONTH(?date)) = ${month}) && ((DAY(?date)) = ${day}))
    } LIMIT 3`;
}

function paintingsByArtist(id) {
    return `
        select distinct ?item ?image ?itemLabel ?itemDescription ?collectionLabel ?described where {
        ?item wdt:P170 wd:${id} .
        ?item wdt:P18 ?image .
        ?item wdt:P195 ?collection .
        ?item wdt:P973 ?described .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl" }
    } LIMIT 100`;
}

function searchPainters(q) {
    return `
    select distinct ?item ?itemLabel ?itemDescription ?itemAltLabel where {
        ?item wdt:P31 wd:Q5; wdt:P106 wd:Q1028181; rdfs:label ?label .
        FILTER( LANG(?label) = "nl" || LANG(?label) = "en" ) .
        FILTER( CONTAINS(LCASE(?label), "${q}") || CONTAINS(LCASE(?altLabel), "${q}") ) .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "nl" } .
    } order by desc(?item)`;
}

function randomArtist() {
    return `
    SELECT DISTINCT ?item ?itemLabel WHERE {
        ?work wdt:P31 wd:Q3305213 .
        ?work wdt:P18 ?image .
        ?work wdt:P195 ?collection .
        ?collection wdt:P17 wd:Q55 .
        ?work wdt:P170 ?item .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl" }
    } LIMIT 1000`;
}

function query(q) {
    const ENDPOINT = `
        https://query.wikidata.org/bigdata/namespace/wdq/sparql
        ?format=json&query=${encodeURIComponent(q)}
    `;

    return rp.get({
        uri : ENDPOINT,
        json : true
    });
}

module.exports = {
    monuments, painterByDate, paintingsByArtist, searchPainters, randomArtist, query
};