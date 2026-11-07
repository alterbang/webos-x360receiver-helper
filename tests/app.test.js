const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const i18n = require("../app/i18n");

function app(defer) {
    const ids = [...fs.readFileSync("app/index.html", "utf8").matchAll(/id="([^"]+)"/g)]
        .map(match => match[1]);
    const elements = {};
    const handlers = {};
    const requests = [];
    const timers = new Map();
    let timerId = 0;
    const document = {
        getElementById: id => elements[id],
        querySelector: () => elements["test-title"],
        querySelectorAll: () => [],
        addEventListener: (type, handler) => { handlers[type] = handler; }
    };
    ids.concat("test-title").forEach(id => {
        elements[id] = {
            disabled: false, hidden: false, textContent: "", className: "",
            focus() { document.activeElement = this; },
            setAttribute() {},
            contains(element) { return Object.values(elements).includes(element); }
        };
    });
    const timersApi = {
        setTimeout(callback, delay) {
            if (delay === 0 && !defer) { callback(); return 0; }
            timers.set(++timerId, callback); return timerId;
        },
        clearTimeout(id) { timers.delete(id); }
    };
    const requestService = function (uri, options) {
        requests.push(options);
        const handle = {cancel() { options.cancelled = true; }};
        if (options.method === "elevateService") {
            options.onSuccess({returnValue: true});
            return handle;
        }
        if (!options.subscribe) {
            const timer = timersApi.setTimeout(() => {
                handle.cancel();
                options.onFailure({errorKey: "requestTimeout"});
            }, 20000);
            const success = options.onSuccess;
            const failure = options.onFailure;
            options.onSuccess = value => { timersApi.clearTimeout(timer); success(value); };
            options.onFailure = value => { timersApi.clearTimeout(timer); failure(value); };
        }
        return handle;
    };
    requestService.cancelAll = () => { timers.clear(); };
    const webOS = {service: {}};
    const window = {i18n: i18n.create("it"), webOS,
        requestService,
        decodePad: require("../app/pad-state"),
        addEventListener: (type, handler) => { handlers[type] = handler; },
        close() {}};
    vm.runInNewContext(fs.readFileSync("app/app.js", "utf8"), {
        window, webOS, document, console,
        setTimeout: timersApi.setTimeout,
        clearTimeout: timersApi.clearTimeout
    });

    return {elements, requests, handlers, timers};
}

test("service requests are deferred until elevation callback unwinds and elevation is reused", () => {
    const f = app(true);
    f.elements.wireless.onclick();
    assert.equal(f.requests.at(-1).method, "elevateService");
    const timer = [...f.timers.entries()][0];
    f.timers.delete(timer[0]);
    timer[1]();
    assert.equal(f.requests.at(-1).method, "wirelessDriver");
    f.requests.at(-1).onSuccess({running: true, ready: true});
    f.elements["wireless-test"].onclick();
    const next = [...f.timers.entries()][0];
    f.timers.delete(next[0]);
    next[1]();
    assert.equal(f.requests.at(-1).method, "watchWirelessInput");
    assert.equal(f.requests.filter(r => r.method === "elevateService").length, 1);
});

test("wireless section uses its own test and does not stop driver when closed", () => {
    const f = app();
    f.elements.wireless.onclick();
    assert.equal(f.elements["led-panel"].hidden, true);
    assert.equal(f.requests.at(-1).parameters.action, "status");
    f.requests.at(-1).onSuccess({running: true, ready: true});
    assert.equal(f.elements["driver-start"].disabled, true);
    assert.equal(f.elements["wireless-test"].disabled, false);
    f.elements["wireless-test"].onclick();
    const watch = f.requests.at(-1);
    assert.equal(watch.method, "watchWirelessInput");
    assert.equal(f.elements["test-title"].textContent, "Prova Xbox One / Series");
    f.elements["test-close"].onclick();
    assert.equal(watch.cancelled, true);
    assert.equal(f.elements["wireless-panel"].hidden, false);
    f.elements["wireless-close"].onclick();
    f.handlers.beforeunload();
    assert.equal(f.requests.some(r => r.parameters && r.parameters.action === "stop"), false);
    f.elements.test.onclick();
    assert.equal(f.requests.at(-1).method, "watchInput");
    assert.equal(f.elements["test-title"].textContent, "Prova il controller");
});

test("unanswered driver calls time out, cancel their bridge and allow another action", () => {
    const f = app();
    f.elements.wireless.onclick();
    f.requests.at(-1).onSuccess({running: true, ready: true});
    f.elements["driver-pair"].onclick();
    const pair = f.requests.at(-1);
    assert.equal(f.elements["wireless-close"].disabled, true);
    for (const callback of [...f.timers.values()]) { callback(); }
    assert.equal(pair.cancelled, true);
    assert.equal(f.elements["wireless-close"].disabled, false);
    assert.match(f.elements["wireless-status"].textContent, /non risponde/);
    f.elements["driver-pair"].onclick();
    assert.equal(f.requests.at(-1).parameters.action, "pair");
    f.requests.at(-1).onSuccess({running: true, ready: true});
    assert.match(f.elements["wireless-status"].textContent, /Associazione attiva/);
});

test("wireless errors allow retry and only explicit Stop invokes driver shutdown", () => {
    const f = app();
    f.elements.wireless.onclick();
    f.requests.at(-1).onSuccess({running: false, ready: false});
    f.elements["driver-start"].onclick();
    f.requests.at(-1).onFailure({errorKey: "firmwareMissing", running: false, ready: false});
    assert.equal(f.elements["driver-start"].disabled, false);
    assert.match(f.elements["wireless-status"].textContent, /Firmware Microsoft mancante/);
    f.elements["driver-start"].onclick();
    f.requests.at(-1).onSuccess({running: true, ready: true});
    f.elements["driver-stop"].onclick();
    assert.equal(f.requests.at(-1).parameters.action, "stop");
    f.requests.at(-1).onSuccess({running: false, ready: false});
    assert.equal(f.elements["wireless-test"].disabled, true);
    assert.equal(f.elements["driver-start"].disabled, false);
});
