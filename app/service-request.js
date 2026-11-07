(function (root) {
    "use strict";
    function create(Bridge, schedule, unschedule) {
        var pending = [];
        function request(uri, options) {
            if (!Bridge) {
                options.onFailure({errorKey: "tvOnly"});
                return {cancel: function () {}};
            }
            var bridge = new Bridge();
            var cancelled = false;
            var timer;
            var subscription = options.subscribe || options.parameters && options.parameters.subscribe;
            var handle = {
                cancel: function () {
                    if (cancelled) { return; }
                    cancelled = true;
                    unschedule(timer);
                    bridge.cancel();
                    var index = pending.indexOf(handle);
                    if (index !== -1) { pending.splice(index, 1); }
                }
            };
            pending.push(handle);
            bridge.onservicecallback = function (text) {
                if (cancelled) { return; }
                var response;
                try { response = JSON.parse(text); }
                catch (error) { response = {returnValue: false, errorKey: "serviceError"}; }
                unschedule(timer);
                var failed = response.returnValue === false || !!response.errorCode;
                if (!subscription || failed || response.subscribed === false) { handle.cancel(); }
                (failed ? options.onFailure : options.onSuccess)(response);
            };
            timer = schedule(function () {
                handle.cancel();
                options.onFailure({errorKey: "requestTimeout"});
            }, (options.timeout || 20) * 1000);
            var parameters = {};
            Object.keys(options.parameters || {}).forEach(function (key) {
                parameters[key] = options.parameters[key];
            });
            if (subscription) { parameters.subscribe = true; }
            bridge.call(uri.replace(/\/$/, "") + "/" + options.method, JSON.stringify(parameters));
            return handle;
        }
        request.cancelAll = function () {
            pending.slice().forEach(function (handle) { handle.cancel(); });
        };
        return request;
    }
    if (typeof module !== "undefined" && module.exports) { module.exports = create; }
    else { root.requestService = create(root.PalmServiceBridge, root.setTimeout, root.clearTimeout); }
}(this));
