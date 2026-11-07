module.exports = function (fs, spawn, kill, getuid, binary, directory) {
    var pidFile = directory + "/driver.pid";
    var logFile = directory + "/driver.log";
    var executable = directory + "/xow";
    var busy = false;

    function runningPid() {
        try {
            var pid = Number(fs.readFileSync(pidFile, "utf8").trim());
            if (!isFinite(pid) || pid < 1 || Math.floor(pid) !== pid) { return null; }
            var command = fs.readFileSync("/proc/" + pid + "/cmdline", "utf8").split("\0")[0];
            if (command !== executable) { return null; }
            if (fs.readFileSync("/proc/" + pid + "/stat", "utf8").split(") ")[1].charAt(0) === "Z") {
                return null;
            }
            kill(pid, 0);
            return pid;
        } catch (error) { return null; }
    }

    function initialized() {
        try { return fs.readFileSync(logFile, "utf8").indexOf("Dongle initialized") !== -1; }
        catch (error) { return false; }
    }

    function respond(message, errorKey) {
        message.respond({returnValue: !errorKey, errorKey: errorKey,
            running: !!runningPid(), ready: !!runningPid() && initialized()});
    }

    function waitForStop(pid, done) {
        var attempts = 0;
        function check() {
            if (runningPid() !== pid) { done(); return; }
            attempts++;
            if (attempts === 30) {
                kill(pid, "SIGKILL");
            }
            if (attempts >= 40) { done("driverError"); return; }
            setTimeout(check, 100);
        }
        check();
    }

    return function (message) {
        var action = message.payload && message.payload.action;
        if (["status", "start", "stop", "pair"].indexOf(action) === -1) {
            respond(message, "invalidDriverAction");
            return;
        }
        if (getuid() !== 0) { respond(message, "rootError"); return; }
        if (action === "status") { respond(message); return; }
        if (busy) { respond(message, "driverBusy"); return; }
        var pid = runningPid();
        if (action === "pair") {
            if (!pid || !initialized()) { respond(message, "driverNotRunning"); return; }
            try { kill(pid, "SIGUSR1"); respond(message); }
            catch (error) { respond(message, "driverError"); }
            return;
        }
        if (action === "stop") {
            if (!pid) { respond(message); return; }
            busy = true;
            try {
                kill(pid, "SIGTERM");
                waitForStop(pid, function (errorKey) {
                    busy = false;
                    respond(message, errorKey);
                });
            } catch (error) { busy = false; respond(message, "driverError"); }
            return;
        }
        if (pid) {
            respond(message, initialized() ? null : "driverNotReady");
            return;
        }
        if (!fs.existsSync(directory + "/xow_dongle.bin")) {
            respond(message, "firmwareMissing");
            return;
        }
        if (!fs.existsSync(binary)) { respond(message, "driverMissing"); return; }
        busy = true;
        var child;
        var log;
        var spawnError = false;
        try {
            fs.writeFileSync(executable, fs.readFileSync(binary), {mode: 448});
            fs.chmodSync(executable, 448);
            log = fs.openSync(logFile, "w", 384);
            var env = {};
            Object.keys(process.env).forEach(function (key) { env[key] = process.env[key]; });
            env.XOW_COMPATIBILITY = "1";
            delete env.XOW_DISABLE_RUMBLE;
            env.XOW_DIAGNOSTICS = "1";
            child = spawn(executable, [], {detached: true, stdio: ["ignore", log, log], env: env});
            child.on("error", function () { spawnError = true; });
            child.unref();
            fs.closeSync(log);
            log = null;
            if (child.pid) { fs.writeFileSync(pidFile, String(child.pid), {mode: 384}); }
        } catch (error) {
            if (log !== undefined && log !== null) { fs.closeSync(log); }
            busy = false;
            respond(message, "driverError");
            return;
        }
        var attempts = 0;
        function check() {
            if (spawnError || !runningPid()) {
                busy = false;
                respond(message, "driverError");
            } else if (initialized()) {
                busy = false;
                respond(message);
            } else if (++attempts >= 80) {
                var current = runningPid();
                if (current) {
                    kill(current, "SIGTERM");
                    waitForStop(current, function () {
                        busy = false;
                        respond(message, "driverNotReady");
                    });
                } else { busy = false; respond(message, "driverError"); }
            } else { setTimeout(check, 100); }
        }
        setTimeout(check, 100);
    };
};
