const test = require("node:test");
const assert = require("node:assert/strict");
const createRequest = require("../app/service-request");

function transport() {
    const bridges = [];
    const timers = new Map();
    let id = 0;
    class Bridge {
        constructor() { bridges.push(this); this.cancelled = false; }
        call(uri, payload) { this.uri = uri; this.payload = JSON.parse(payload); }
        cancel() { this.cancelled = true; }
        reply(value) { this.onservicecallback(JSON.stringify(value)); }
    }
    const request = createRequest(Bridge, callback => { timers.set(++id, callback); return id; },
        id => timers.delete(id));
    return {request, bridges, timers};
}

test("nested native calls remain alive after the previous bridge completes", () => {
    const f = transport();
    let paired = false;
    f.request("luna://elevate", {method: "root", onFailure: assert.fail,
        onSuccess() {
            f.request("luna://driver", {method: "pair", parameters: {action: "pair"},
                onFailure: assert.fail, onSuccess() { paired = true; }});
        }});
    f.bridges[0].reply({returnValue: true});
    assert.equal(f.bridges[0].cancelled, true);
    assert.equal(f.bridges[1].cancelled, false);
    assert.equal(f.bridges[1].uri, "luna://driver/pair");
    f.bridges[1].reply({returnValue: true});
    assert.equal(paired, true);
    assert.equal(f.timers.size, 0);
});

test("native input subscription streams until cancelled without an idle timeout", () => {
    const f = transport();
    const snapshots = [];
    const handle = f.request("luna://input", {method: "watch", subscribe: true,
        onFailure: assert.fail, onSuccess: value => snapshots.push(value)});
    assert.equal(f.bridges[0].payload.subscribe, true);
    f.bridges[0].reply({returnValue: true, pads: []});
    f.bridges[0].reply({returnValue: true, pads: [{slot: 1}]});
    assert.equal(snapshots.length, 2);
    assert.equal(f.timers.size, 0);
    assert.equal(f.bridges[0].cancelled, false);
    handle.cancel();
    f.bridges[0].reply({returnValue: true});
    assert.equal(snapshots.length, 2);
});

test("missing first response times out and late replies are ignored", () => {
    const f = transport();
    const errors = [];
    f.request("luna://driver", {method: "start",
        onSuccess: assert.fail, onFailure: value => errors.push(value.errorKey)});
    [...f.timers.values()][0]();
    f.bridges[0].reply({returnValue: true});
    assert.deepEqual(errors, ["requestTimeout"]);
    assert.equal(f.bridges[0].cancelled, true);
});
