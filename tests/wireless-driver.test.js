const test = require("node:test");
const assert = require("node:assert/strict");
const EventEmitter = require("node:events");
const createDriver = require("../service/wireless-driver");

function fixture(uid = 0) {
    const files = {
        "/native/xow": "binary",
        "/state/xow_dongle.bin": "firmware"
    };
    const signals = [];
    let launches = 0;
    const fs = {
        readFileSync(name) {
            if (!(name in files)) { throw new Error("missing"); }
            return files[name];
        },
        writeFileSync(name, value) { files[name] = value; },
        chmodSync() {}, openSync() { return 10; }, closeSync() {},
        existsSync(name) { return name in files; }
    };
    const spawn = (file, args, options) => {
        launches++;
        assert.equal(file, "/state/xow");
        assert.equal(options.detached, true);
        assert.equal(options.env.XOW_COMPATIBILITY, "1");
        assert.equal(options.env.XOW_DISABLE_RUMBLE, undefined);
        assert.equal(options.env.XOW_DIAGNOSTICS, "1");
        assert.deepEqual(options.stdio, ["ignore", 10, 10]);
        files["/proc/42/cmdline"] = file + "\0";
        files["/proc/42/stat"] = "42 (xow) S";
        files["/state/driver.log"] = "Dongle initialized\n";
        const child = new EventEmitter();
        child.pid = 42;
        child.unref = () => {};
        return child;
    };
    const kill = (pid, signal) => {
        if (signal === 0) { return; }
        signals.push([pid, signal]);
        if (signal === "SIGTERM") { delete files["/proc/" + pid + "/cmdline"]; }
    };
    const driver = createDriver(fs, spawn, kill, () => uid, "/native/xow", "/state");
    const call = action => new Promise(resolve => driver({payload: {action}, respond: resolve}));
    return {call, files, signals, launches: () => launches};
}

test("wireless driver starts once, survives status calls, pairs and stops explicitly", async () => {
    const f = fixture();
    assert.equal((await f.call("start")).ready, true);
    assert.equal((await f.call("start")).running, true);
    assert.equal(f.launches(), 1);
    assert.equal((await f.call("status")).ready, true);
    assert.equal((await f.call("pair")).returnValue, true);
    assert.deepEqual(f.signals, [[42, "SIGUSR1"]]);
    assert.equal((await f.call("stop")).running, false);
    assert.deepEqual(f.signals[1], [42, "SIGTERM"]);
});

test("missing firmware, unprivileged actions and stale PIDs never start or signal a driver", async () => {
    const f = fixture();
    delete f.files["/state/xow_dongle.bin"];
    assert.equal((await f.call("start")).errorKey, "firmwareMissing");
    f.files["/state/driver.pid"] = "42";
    f.files["/proc/42/cmdline"] = "/unrelated\0";
    assert.equal((await f.call("stop")).returnValue, true);
    assert.equal((await f.call("pair")).errorKey, "driverNotRunning");
    assert.equal(f.launches(), 0);
    assert.deepEqual(f.signals, []);
    const user = fixture(1000);
    assert.equal((await user.call("start")).errorKey, "rootError");
    assert.equal(user.launches(), 0);
});

test("concurrent start is rejected and zombie processes are reported stopped", async () => {
    const f = fixture();
    const starting = f.call("start");
    assert.equal((await f.call("start")).errorKey, "driverBusy");
    await starting;
    f.files["/proc/42/stat"] = "42 (xow) Z";
    assert.equal((await f.call("status")).running, false);
    assert.equal((await f.call("pair")).errorKey, "driverNotRunning");
});
