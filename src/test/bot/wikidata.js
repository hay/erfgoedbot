const rp = require("request-promise");
const Bluebird = require('bluebird');
require('sinon-as-promised')(Bluebird);
const sinon = require("sinon");
const expect = require("expect");

const queries = require("../../bot/queries");

const {
    paintingsByArtist, searchPainters, painterByDate, getMonuments, randomArtist
} = require("../../bot/wikidata");


describe("wikidata", () => {
    describe("painter searches", () => {
        let rpStub, spy;
        beforeEach(() => {
            rpStub = sinon.stub(rp, 'get');
            spy = sinon.spy(queries, 'query');
            rpStub.resolves({results: {bindings: []}});
        });

        afterEach(() => {
            rpStub.restore();
            queries.query.restore();
        });

        describe("randomArtist", () => {
            it("should invoke query at let it invoke handlePainters", (done) => {
                const expectedQuery = "[RANDOM ARTIST QUERY]";
                sinon.stub(queries, 'randomArtist', () => expectedQuery);

                randomArtist((msg) => {
                    queries.randomArtist.restore();
                    try {
                        expect(spy.calledWith(expectedQuery)).toEqual(true);
                        expect(msg).toEqual("Sorry, ik kan geen schilders vinden die zo heten.");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });

        describe("searchPainters", () => {
            it("should invoke query at let it invoke handlePainters", (done) => {
                const expectedQuery = "[artist QUERY]";
                sinon.stub(queries, 'searchPainters', (q) => `[${q} QUERY]`);

                searchPainters("ARTIST", (msg) => {
                    queries.searchPainters.restore();
                    try {
                        expect(spy.calledWith(expectedQuery)).toEqual(true);
                        expect(msg).toEqual("Sorry, ik kan geen schilders vinden die zo heten.");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });


        describe("painterByDate", () => {
            it("should invoke query at let it invoke handlePainters", (done) => {
                const expectedQuery = "[11-10 QUERY]";
                sinon.stub(queries, 'painterByDate', (m, d) => `[${d}-${m} QUERY]`);

                painterByDate(10, 11, (_, payload) => {
                    queries.painterByDate.restore();
                    try {
                        expect(spy.calledWith(expectedQuery)).toEqual(true);
                        expect(payload).toEqual({
                            text: 'Deze schilders zijn geboren op 11-10. Kies er een.',
                            data: []
                        });
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    describe("handlePainters", () => {
        it("should respond with painters when painters were found", (done) => {
            const rpStub = sinon.stub(rp, 'get');
            rpStub.resolves({results: {bindings: require("./res/painters")}});

            sinon.stub(queries, 'randomArtist');

            randomArtist((msg, payload) => {
                queries.randomArtist.restore();
                rpStub.restore();
                try {
                    expect(msg).toEqual(null);
                    expect(payload).toEqual({
                        data: [
                            { payload: 'Q5582', title: 'Vincent van Gogh' },
                            { payload: 'Q317188', title: 'Theo van Gogh' },
                            { payload: 'Q12173703', title: 'Jan van Gogh' }],
                        text: 'Welke van deze schilders wil je hebben?'
                    });
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });


    describe("images searches", () => {
        let rpStub, spy;
        beforeEach(() => {
            rpStub = sinon.stub(rp, 'get');
            spy = sinon.spy(queries, 'query');
            rpStub.resolves({results: {bindings: []}});
        });

        afterEach(() => {
            rpStub.restore();
            queries.query.restore();
        });

        describe("paintingsByArtist", () => {
            it("should invoke query at let it invoke handleImages", (done) => {
                const expectedQuery = "[123 QUERY]";
                sinon.stub(queries, 'paintingsByArtist', (id) => `[${id} QUERY]`);

                paintingsByArtist(123, (msg) => {
                    queries.paintingsByArtist.restore();
                    try {
                        expect(spy.calledWith(expectedQuery)).toEqual(true);
                        expect(msg).toEqual("Sorry, daar kan ik geen schilderijen van vinden.");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });

        describe("getMonuments", () => {
            it("should invoke query at let it invoke handleImages", (done) => {
                const expectedQuery = "[Q803 QUERY]";
                sinon.stub(queries, 'monuments', (q) => `[${q} QUERY]`);

                getMonuments((msg) => {
                    queries.monuments.restore();
                    try {
                        expect(spy.calledWith(expectedQuery)).toEqual(true);
                        expect(msg).toEqual("Sorry, daar kan ik geen schilderijen van vinden.");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });


    describe("handleImages", () => {
        it("should respond with images when paintings were found", (done) => {
            const rpStub = sinon.stub(rp, 'get');
            rpStub.resolves({results: {bindings: require("./res/paintings")}});

            sinon.stub(queries, 'paintingsByArtist');

            paintingsByArtist(0, (msg, payload) => {
                queries.paintingsByArtist.restore();
                rpStub.restore();
                try {
                    expect(msg).toEqual(null);
                    expect(payload).toEqual({
                        author: null,
                        collection: 'Van Gogh Museum',
                        description: 'painting by Vincent van Gogh, 1887',
                        id: 'Q19836161',
                        image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Moestuin%20met%20zonnebloem%20-%20s0004V1962v%20-%20Van%20Gogh%20Museum.jpg',
                        label: 'Allotment with Sunflower',
                        url: 'http://www.vggallery.com/painting/p_0388v.htm'
                    });
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
});