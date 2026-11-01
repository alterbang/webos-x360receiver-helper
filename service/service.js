var Service = require("webos-service");
var childProcess = require("child_process");
var path = require("path");
var createHandler = require("./led-handler");

var service = new Service(require("./package.json").name);
service.register("setLed", createHandler(
    childProcess.execFile,
    process.getuid,
    path.join(__dirname, "xbox-led.py")
));

var createMonitor = require("./input-monitor");
var monitor = createMonitor(childProcess.spawn, process.getuid,
    path.join(__dirname, "read-input.py"));
service.register("watchInput", monitor.subscribe, monitor.cancel);
