module.exports = function (spawn, getuid, scriptPath) {
    var clients = {};
    var reader = null;
    var latest = null;

    function broadcast(state) {
        latest = state;
        Object.keys(clients).forEach(function (token) {
            clients[token].respond(state);
        });
    }

    function start() {
        var child = spawn("/usr/bin/python", ["-u", scriptPath]);
        var buffer = "";
        var stderr = "";
        reader = child;
        child.stdout.on("data", function (chunk) {
            buffer += chunk.toString();
            var newline;
            while ((newline = buffer.indexOf("\n")) !== -1) {
                var line = buffer.slice(0, newline);
                buffer = buffer.slice(newline + 1);
                try {
                    var state = JSON.parse(line);
                    state.returnValue = true;
                    state.subscribed = true;
                    broadcast(state);
                } catch (error) {
                    console.error("Invalid input snapshot: " + error.message);
                }
            }
        });
        child.stderr.on("data", function (chunk) {
            stderr = (stderr + chunk.toString()).slice(-2048);
        });
        function failed(text) {
            if (reader !== child) { return; }
            reader = null;
            latest = null;
            Object.keys(clients).forEach(function (token) {
                clients[token].cancel({returnValue: false, errorText: text});
            });
            clients = {};
        }
        child.on("error", function (error) { failed(error.message); });
        child.on("exit", function () { failed(stderr || "Lettura del pad interrotta."); });
    }

    return {
        subscribe: function (message) {
            if (!message.isSubscription || getuid() !== 0) {
                message.respond({returnValue: false, errorText: "Richiesti root e subscribe:true."});
                return;
            }
            clients[message.uniqueToken] = message;
            if (latest) { message.respond(latest); }
            if (!reader) { start(); }
        },
        cancel: function (message) {
            delete clients[message.uniqueToken];
            if (!Object.keys(clients).length && reader) {
                var child = reader;
                reader = null;
                latest = null;
                child.kill();
            }
        }
    };
};
