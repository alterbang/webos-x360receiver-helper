module.exports = function (execFile, getuid, scriptPath) {
    var busy = false;
    return function (message) {
        var mode = message.payload && message.payload.mode;
        if (mode !== "off" && mode !== "player1") {
            message.respond({returnValue: false, errorText: "Modalita LED non valida."});
            return;
        }
        if (getuid() !== 0) {
            message.respond({
                returnValue: false,
                errorText: "Permessi root mancanti. Riapri Xbox LED con Homebrew Channel installato."
            });
            return;
        }
        if (busy) {
            message.respond({returnValue: false, errorText: "Un comando LED e gia in corso."});
            return;
        }
        busy = true;
        execFile("/usr/bin/python", [scriptPath, mode === "off" ? "0" : "6"], {
            timeout: 15000,
            maxBuffer: 16384
        }, function (error, stdout, stderr) {
            busy = false;
            if (error) {
                message.respond({
                    returnValue: false,
                    errorText: (stderr || error.message).trim()
                });
                return;
            }
            message.respond({returnValue: true, mode: mode, details: stdout.trim()});
        });
    };
};
