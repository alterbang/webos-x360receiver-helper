module.exports = function (execFile, getuid, scriptPath) {
    var busy = false;
    return function (message) {
        var mode = message.payload && message.payload.mode;
        if (mode !== "off" && mode !== "auto") {
            message.respond({returnValue: false, errorKey: "invalidMode", errorText: "Invalid LED mode."});
            return;
        }
        if (getuid() !== 0) {
            message.respond({
                returnValue: false,
                errorKey: "rootError", errorText: "Root permissions required."
            });
            return;
        }
        if (busy) {
            message.respond({returnValue: false, errorKey: "busy", errorText: "A LED command is already running."});
            return;
        }
        busy = true;
        var command = mode === "off" ? "0" : "auto";
        execFile("/usr/bin/python", [scriptPath, command], {
            timeout: 15000,
            maxBuffer: 16384
        }, function (error, stdout, stderr) {
            busy = false;
            if (error) {
                message.respond({
                    returnValue: false,
                    errorKey: "usbError",
                    errorText: (stderr || error.message).trim()
                });
                return;
            }
            message.respond({returnValue: true, mode: mode, details: stdout.trim()});
        });
    };
};
