const test = require("node:test");
const assert = require("node:assert/strict");
const createHandler = require("../service/led-handler");

function message(mode) {
    return {
        payload: {mode},
        responses: [],
        respond(response) { this.responses.push(response); }
    };
}

test("only fixed LED modes can invoke Python", () => {
    const handler = createHandler(() => assert.fail("must not execute"), () => 0, "/led.py");
    for (const mode of ["6", undefined, "off; reboot", 6]) {
        const request = message(mode);
        handler(request);
        assert.equal(request.responses[0].returnValue, false);
    }
});

test("non-root requests do not detach USB drivers", () => {
    const handler = createHandler(() => assert.fail("must not execute"), () => 1000, "/led.py");
    const request = message("off");
    handler(request);
    assert.equal(request.responses[0].returnValue, false);
});

test("LED modes use the verified protocol commands without a shell", () => {
    for (const [mode, command] of [["off", "0"], ["player1", "6"]]) {
        const handler = createHandler((file, args, options, callback) => {
            assert.equal(file, "/usr/bin/python");
            assert.deepEqual(args, ["/led.py", command]);
            assert.ok(options.timeout > 4000);
            callback(null, "xpad restored\n", "");
        }, () => 0, "/led.py");
        const request = message(mode);
        handler(request);
        assert.equal(request.responses[0].returnValue, true);
    }
});

test("concurrent USB operations are rejected and failure allows a retry", () => {
    let complete;
    const handler = createHandler((file, args, options, callback) => {
        complete = callback;
    }, () => 0, "/led.py");
    const first = message("off");
    handler(first);
    const second = message("player1");
    handler(second);
    assert.equal(second.responses[0].returnValue, false);
    complete(new Error("USB failure"), "", "receiver missing");
    assert.equal(first.responses[0].errorText, "receiver missing");
    const retry = message("player1");
    handler(retry);
    complete(null, "xpad restored", "");
    assert.equal(retry.responses[0].returnValue, true);
});
