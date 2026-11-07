const test = require("node:test");
const assert = require("node:assert/strict");
const EventEmitter = require("node:events");
const createMonitor = require("../service/input-monitor");

function message(token) {
    return {isSubscription: true, uniqueToken: token, responses: [],
        respond(value) { this.responses.push(value); },
        cancel(value) { this.responses.push(value); }};
}

test("input stream handles partial JSON and stops when the last viewer leaves", () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    let kills = 0;
    child.kill = () => { kills++; };
    const monitor = createMonitor((file, args) => {
        assert.deepEqual(args, ["-u", "/read.py"]);
        return child;
    }, () => 0, "/read.py");
    const first = message("first");
    const second = message("second");
    monitor.subscribe(first);
    child.stdout.emit("data", '{"pads":[');
    assert.equal(first.responses.length, 0);
    child.stdout.emit("data", ']}\n');
    assert.deepEqual(first.responses[0].pads, []);
    monitor.subscribe(second);
    assert.equal(second.responses[0].subscribed, true);
    monitor.cancel(first);
    assert.equal(kills, 0);
    monitor.cancel(second);
    assert.equal(kills, 1);
});

test("wireless reader receives its family and remains independent of 360 viewers", () => {
    const children = [];
    const spawn = (file, args) => {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.kills = 0;
        child.kill = () => { child.kills++; };
        children.push({child, args});
        return child;
    };
    const xbox360 = createMonitor(spawn, () => 0, "/read.py");
    const wireless = createMonitor(spawn, () => 0, "/read.py", "one");
    const first = message("360");
    const second = message("one");
    xbox360.subscribe(first);
    wireless.subscribe(second);
    assert.deepEqual(children[1].args, ["-u", "/read.py", "one"]);
    wireless.cancel(second);
    assert.equal(children[1].child.kills, 1);
    assert.equal(children[0].child.kills, 0);
    xbox360.cancel(first);
});

test("reader failures notify subscribers and allow reopening the test", () => {
    const children = [];
    const monitor = createMonitor(() => {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.kill = () => {};
        children.push(child);
        return child;
    }, () => 0, "/read.py");
    const first = message("first");
    monitor.subscribe(first);
    children[0].emit("error", new Error("cannot start"));
    assert.equal(first.responses[0].returnValue, false);
    monitor.subscribe(message("retry"));
    assert.equal(children.length, 2);
});
