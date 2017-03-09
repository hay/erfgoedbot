const sinon = require("sinon");
const expect = require("expect");

const wikidata = require("../../bot/wikidata");
const {  paintingsByArtist, searchPainters, painterByDate, getMonuments, randomArtist } = require("../../bot/search");

describe("search", () => {

    describe("paintingsByArtist", () => {
        it("should invoke wikidata.paintingsByArtist and handle success", (done) => {
            const searchResult = {payload: "payload"};
            const finalize = (e) => {
                wikidata.paintingsByArtist.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(null);
                    expect(data).toEqual({
                        images: searchResult,
                        type: 'images'
                    });
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'paintingsByArtist', (id, responseCallback) => {
                try {
                    expect(id).toEqual(123);
                    responseCallback(null, searchResult, assertCallback);
                } catch (e) {
                    finalize(e);
                }
            });

            paintingsByArtist(123, assertCallback);
        });

        it("should invoke wikidata.paintingsByArtist and handle an error", (done) => {
            const error = {error: "error"};
            const finalize = (e) => {
                wikidata.paintingsByArtist.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(error);
                    expect(data).toEqual(null);
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'paintingsByArtist', (id, responseCallback) => {
                try {
                    responseCallback(error, null, assertCallback);
                } catch (e) {
                    finalize(e);
                }
            });

            paintingsByArtist(123, assertCallback);
        });
    });

    describe("getMonuments", () => {
        it("should invoke wikidata.getMonuments and handle success", (done) => {
            const searchResult = {payload: "payload"};
            const finalize = (e) => {
                wikidata.getMonuments.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(null);
                    expect(data).toEqual({
                        images: searchResult,
                        type: 'images'
                    });
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'getMonuments', (responseCallback) => responseCallback(null, searchResult, assertCallback));

            getMonuments(assertCallback);
        });

        it("should invoke wikidata.getMonuments and handle an error", (done) => {
            const error = {error: "error"};
            const finalize = (e) => {
                wikidata.getMonuments.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(error);
                    expect(data).toEqual(null);
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'getMonuments', (responseCallback) => responseCallback(error, null, assertCallback));

            getMonuments(assertCallback);
        });
    });

    describe("searchPainters", () => {
        it("should invoke wikidata.searchPainters and handle success", (done) => {
            const searchResult = {payload: "payload"};
            const finalize = (e) => {
                wikidata.searchPainters.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(null);
                    expect(data).toEqual({
                        buttons: searchResult,
                        type: 'buttons'
                    });
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'searchPainters', (q, responseCallback) => {
                try {
                    expect(q).toEqual("q");
                    responseCallback(null, searchResult, assertCallback);
                } catch (e) {
                    finalize(e);
                }
            });

            searchPainters("q", assertCallback);
        });

        it("should invoke wikidata.searchPainters and handle an error", (done) => {
            const error = {error: "error"};
            const finalize = (e) => {
                wikidata.searchPainters.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(error);
                    expect(data).toEqual(null);
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'searchPainters', (q, responseCallback) => {
                try {
                    responseCallback(error, null, assertCallback);
                } catch (e) {
                    finalize(e);
                }
            });

            searchPainters("q", assertCallback);
        });
    });

    describe("painterByDate", () => {
        it("should invoke wikidata.painterByDate and handle success", (done) => {
            const searchResult = {payload: "payload"};
            const finalize = (e) => {
                wikidata.painterByDate.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(null);
                    expect(data).toEqual({
                        buttons: searchResult,
                        type: 'buttons'
                    });
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'painterByDate', (d, m, responseCallback) => {
                try {
                    expect(d).toEqual(1);
                    expect(m).toEqual(2);
                    responseCallback(null, searchResult, assertCallback);
                } catch (e) {
                    finalize(e);
                }
            });

            painterByDate(1, 2, assertCallback);
        });

        it("should invoke wikidata.painterByDate and handle null", (done) => {
            const finalize = (e) => {
                wikidata.painterByDate.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(data).toEqual(null);
                    expect(err).toEqual("Geen resultaten gevonden");
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'painterByDate', (d, m, responseCallback) => {
                try {
                    expect(d).toEqual(1);
                    expect(m).toEqual(2);
                    responseCallback({}, null, assertCallback);
                } catch (e) {
                    finalize(e);
                }
            });

            painterByDate(1, 2, assertCallback);
        });
    });

    describe("randomArtist", () => {
        it("should invoke wikidata.randomArtist and handle success", (done) => {
            const searchResult = {data: [{payload: "payload"}, {payload: "payload"}]};
            const finalize = (e) => {
                wikidata.randomArtist.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(null);
                    expect(data).toEqual({
                        buttons: { data: [{payload: "payload"}]},
                        type: 'buttons'
                    });
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'randomArtist', (responseCallback) =>
                responseCallback(null, searchResult, assertCallback));

            randomArtist(assertCallback);
        });

        it("should invoke wikidata.randomArtist and handle an error", (done) => {
            const error = {error: "error"};
            const finalize = (e) => {
                wikidata.randomArtist.restore();
                done(e);
            };

            const assertCallback = (err, data) => {
                try {
                    expect(err).toEqual(error);
                    expect(data).toEqual(null);
                    finalize();
                } catch(e) {
                    finalize(e);
                }
            };

            sinon.stub(wikidata, 'randomArtist', (responseCallback) =>
                responseCallback(error, null, assertCallback));

            randomArtist(assertCallback);
        });
    });

});