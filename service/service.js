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

var wirelessMonitor = createMonitor(childProcess.spawn, process.getuid,
    path.join(__dirname, "read-input.py"), "one");
service.register("watchWirelessInput", wirelessMonitor.subscribe, wirelessMonitor.cancel);

service.register("wirelessDriver", require("./wireless-driver")(
    require("fs"), childProcess.spawn, process.kill, process.getuid,
    path.join(__dirname, "native", "xow"), "/media/developer/xbox-wireless"
));
