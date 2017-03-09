const expect = require("expect");

describe("webhook", () => {
    it("should handle messages", (done) => {
        const expectedHandlers = {expected: "handler"};
        const eventPayload = {message: "message payload"};
        const req = {body: {object: 'page', entry: [
            {messaging: [eventPayload]}
        ]}};
        const underTest = require("../../bot/webhook")({
            receivedMessage: (data, handlers) => {
                try {
                    expect(data).toEqual(eventPayload);
                    expect(handlers).toEqual(expectedHandlers);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        }, expectedHandlers);
        underTest(req, {sendStatus: () => {}});
    });

    it("should handle postbacks", (done) => {
        const expectedHandlers = {expected: "handler"};
        const eventPayload = {postback: "postback payload"};
        const req = {body: {object: 'page', entry: [
            {messaging: [eventPayload]}
        ]}};
        const underTest = require("../../bot/webhook")({
            receivedPostback: (data, handlers) => {
                try {
                    expect(data).toEqual(eventPayload);
                    expect(handlers).toEqual(expectedHandlers);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        }, expectedHandlers);
        underTest(req, {sendStatus: () => {}});
    });

    it("should handle delivery confirmations", (done) => {
        const eventPayload = {delivery: "delivery payload"};
        const req = {body: {object: 'page', entry: [
            {messaging: [eventPayload]}
        ]}};
        const underTest = require("../../bot/webhook")({
            receivedDeliveryConfirmation: (data) => {
                try {
                    expect(data).toEqual(eventPayload);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        }, {});
        underTest(req, {sendStatus: () => {}});
    });

    it("should handle read confirmations", (done) => {
        const eventPayload = {read: "read payload"};
        const req = {body: {object: 'page', entry: [
            {messaging: [eventPayload]}
        ]}};
        const underTest = require("../../bot/webhook")({
            receivedMessageRead: (data) => {
                try {
                    expect(data).toEqual(eventPayload);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        }, {});
        underTest(req, {sendStatus: () => {}});
    });

    it("should send 200 OK", (done) => {
        const underTest = require("../../bot/webhook")({}, {});
        const req = {body: {object: 'page', entry: []}};

        underTest(req, {sendStatus: (statusCode) => {
            try {
                expect(statusCode).toEqual(200);
                done();
            } catch (e) {
                done(e);
            }
        }});
    });
});