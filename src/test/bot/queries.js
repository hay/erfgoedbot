const expect = require("expect");

const {
    monuments, painterByDate, paintingsByArtist, searchPainters, randomArtist
} = require("../../bot/queries");

const splitAndFilter = (str) => str
    .split(/\n/)
    .map(r => r.trim())
    .filter(r => r.length !== 0);

describe("queries", () => {

    describe("monuments", () => {
        it("should build a sparql query based on the location name", () => {
            const result = splitAndFilter(monuments("utrecht"));

            expect(result.length).toEqual(6);
            expect(result[0]).toEqual("SELECT ?item ?itemLabel ?itemDescription ?image WHERE {");
            expect(result[1]).toEqual("?item wdt:P1435 wd:Q916333 .");
            expect(result[2]).toEqual("?item wdt:P131 wd:utrecht .");
            expect(result[3]).toEqual("?item wdt:P18 ?image .");
            expect(result[4]).toEqual(`SERVICE wikibase:label { bd:serviceParam wikibase:language "nl". }`);
            expect(result[5]).toEqual("} LIMIT 100");
        });
    });

    describe("painterByDate", () => {
        it("should build a sparql query based on the month and day", () => {
            const month = 10;
            const day = 5;
            const result = splitAndFilter(painterByDate(month, day));

            expect(result.length).toEqual(8);
            expect(result[0]).toEqual(`PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>`);
            expect(result[1]).toEqual("SELECT ?entity (YEAR(?date) AS ?year) ?entityLabel WHERE {");
            expect(result[2]).toEqual("?entity wdt:P31 wd:Q5.");
            expect(result[3]).toEqual("?entity wdt:P106 wd:Q1028181.");
            expect(result[4]).toEqual("?entity wdt:P569 ?date.");
            expect(result[5]).toEqual(`SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl". }`);
            expect(result[6]).toEqual(`FILTER(((DATATYPE(?date)) = xsd:dateTime) && ((MONTH(?date)) = ${month}) && ((DAY(?date)) = ${day}))`);
            expect(result[7]).toEqual("} LIMIT 3");
        });
    });

    describe("paintingsByArtist", () => {
        it("should build a sparql query based on the artist ID", () => {
            const id = 123;
            const result = splitAndFilter(paintingsByArtist(id));

            expect(result.length).toEqual(7);
            expect(result[0]).toEqual("select distinct ?item ?image ?itemLabel ?itemDescription ?collectionLabel ?described where {");
            expect(result[1]).toEqual(`?item wdt:P170 wd:${id} .`);
            expect(result[2]).toEqual("?item wdt:P18 ?image .");
            expect(result[3]).toEqual("?item wdt:P195 ?collection .");
            expect(result[4]).toEqual("?item wdt:P973 ?described .");
            expect(result[5]).toEqual(`SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl" }`);
            expect(result[6]).toEqual("} LIMIT 100");
        });
    });

    describe("searchPainters", () => {
        it("should build a sparql query based on the query string", () => {
            const query = "gogh";
            const result = splitAndFilter(searchPainters(query));

            expect(result.length).toEqual(6);
            expect(result[0]).toEqual("select distinct ?item ?itemLabel ?itemDescription ?itemAltLabel where {");
            expect(result[1]).toEqual("?item wdt:P31 wd:Q5; wdt:P106 wd:Q1028181; rdfs:label ?label .");
            expect(result[2]).toEqual(`FILTER( LANG(?label) = "nl" || LANG(?label) = "en" ) .`);
            expect(result[3]).toEqual(`FILTER( CONTAINS(LCASE(?label), "${query}") || CONTAINS(LCASE(?altLabel), "${query}") ) .`);
            expect(result[4]).toEqual(`SERVICE wikibase:label { bd:serviceParam wikibase:language "nl" } .`);
            expect(result[5]).toEqual("} order by desc(?item)");
        });
    });

    describe("randomArtist", () => {
        it("should return this exact sparql query", () => {
            const result = splitAndFilter(randomArtist());

            expect(result.length).toEqual(8);
            expect(result[0]).toEqual("SELECT DISTINCT ?item ?itemLabel WHERE {");
            expect(result[1]).toEqual("?work wdt:P31 wd:Q3305213 .");
            expect(result[2]).toEqual("?work wdt:P18 ?image .");
            expect(result[3]).toEqual("?work wdt:P195 ?collection .");
            expect(result[4]).toEqual("?collection wdt:P17 wd:Q55 .");
            expect(result[5]).toEqual("?work wdt:P170 ?item .");
            expect(result[6]).toEqual(`SERVICE wikibase:label { bd:serviceParam wikibase:language "en,nl" }`);
            expect(result[7]).toEqual("} LIMIT 1000");
        });
    })
});