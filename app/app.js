(function () {
    "use strict";
    var buttons = [document.getElementById("auto"), document.getElementById("off"),
        document.getElementById("test"), document.getElementById("wireless"),
        document.getElementById("driver-start"), document.getElementById("driver-pair"),
        document.getElementById("wireless-test"), document.getElementById("driver-stop"),
        document.getElementById("wireless-close")];
    var status = document.getElementById("status");
    var busy = false;
    var subscription = null;
    var testing = false;
    var selectedSlot = null;
    var eventCounts = {};
    var family = "360";
    var wirelessPage = false;
    var driverState = {running: false, ready: false};
    var elevated = false;
    var inputTimer = null;
    var t = window.i18n.t;

    function request(uri, options) {
        return window.requestService(uri, options);
    }

    function elevate(success, failure) {
        if (elevated) { setTimeout(success, 0); return; }
        request("luna://org.webosbrew.hbchannel.service", {
            method: "elevateService",
            parameters: {id: "com.paolo.xboxleds.service"},
            timeout: 15,
            onSuccess: function () {
                elevated = true;
                setTimeout(success, 0);
            },
            onFailure: failure
        });
    }

    function finish(text, error, button) {
        busy = false;
        buttons.forEach(function (item) { item.disabled = false; });
        updateDriver(driverState);
        status.textContent = text;
        status.className = error ? "error" : "";
        button.focus();
    }

    function setLed(mode, button) {
        if (busy) { return; }
        if (!window.webOS || !webOS.service) {
            finish(t("tvOnly"), true, button);
            return;
        }
        busy = true;
        buttons.forEach(function (item) { item.disabled = true; });
        status.className = "";
        status.textContent = t("permissions");
        elevate(function () {
                status.textContent = t("sending");
                request("luna://com.paolo.xboxleds.service", {
                    method: "setLed",
                    parameters: {mode: mode},
                    timeout: 20,
                    onSuccess: function () {
                        var resultKey = mode === "off" ? "sentOff" : "sentAuto";
                        finish(t(resultKey), false, button);
                    },
                    onFailure: function (response) {
                        finish(window.i18n.error(response, "usbError"), true, button);
                    }
                });
            }, function (response) {
                finish(t("rootError"), true, button);
            });
    }

    function clearPad() {
        Array.prototype.forEach.call(document.querySelectorAll("#pad .control"), function (item) {
            item.classList.remove("active");
        });
        document.getElementById("left-dot").setAttribute("transform", "translate(0 0)");
        document.getElementById("right-dot").setAttribute("transform", "translate(0 0)");
    }

    function renderPads(response) {
        if (!testing) { return; }
        clearTimeout(inputTimer);
        var pads = response.pads || [];
        var label = document.getElementById("pad-status");
        if (!pads.length) {
            clearPad();
            selectedSlot = null;
            eventCounts = {};
            label.textContent = t(family === "one" ? "wirelessMissing" : "receiverMissing");
            document.getElementById("pad-values").textContent = "";
            return;
        }
        var selected = null;
        pads.forEach(function (pad) {
            if (pad.slot === selectedSlot) { selected = pad; }
        });
        pads.forEach(function (pad) {
            if (pad.events > (eventCounts[pad.slot] || 0)) { selected = pad; }
            eventCounts[pad.slot] = pad.events;
        });
        if (!selected) { selected = pads[0]; }
        selectedSlot = selected.slot;
        var state = window.decodePad(selected);
        clearPad();
        Object.keys(state.buttons).forEach(function (name) {
            if (state.buttons[name]) { document.getElementById("pad-" + name).classList.add("active"); }
        });
        ["lt", "rt"].forEach(function (name) {
            if (state[name] > 0.01) { document.getElementById("pad-" + name).classList.add("active"); }
        });
        document.getElementById("left-dot").setAttribute("transform",
            "translate(" + state.left[0] * 30 + " " + state.left[1] * 30 + ")");
        document.getElementById("right-dot").setAttribute("transform",
            "translate(" + state.right[0] * 30 + " " + state.right[1] * 30 + ")");
        label.textContent = t("receiverPresent") + selected.slot +
            (selected.events ? t("events") + selected.events : t("pressPad"));
        var pressed = Object.keys(state.buttons).filter(function (name) { return state.buttons[name]; });
        document.getElementById("pad-values").textContent =
            t("keys") + (pressed.join(", ").toUpperCase() || "-") +
            " | LT " + Math.round(state.lt * 100) + "% | RT " + Math.round(state.rt * 100) + "%\n" +
            t("leftStick") + state.left.map(function (v) { return v.toFixed(2); }).join(", ") +
            " | " + t("rightStick") + state.right.map(function (v) { return v.toFixed(2); }).join(", ");
    }

    function closeTest() {
        testing = false;
        clearTimeout(inputTimer);
        if (subscription) { subscription.cancel(); subscription = null; }
        document.getElementById("test-panel").hidden = true;
        document.getElementById(wirelessPage ? "wireless-panel" : "led-panel").hidden = false;
        document.getElementById(wirelessPage ? "wireless-test" : "test").focus();
    }

    function openTest(selectedFamily) {
        if (busy) { return; }
        testing = true;
        family = selectedFamily;
        selectedSlot = null;
        eventCounts = {};
        clearPad();
        document.getElementById("led-panel").hidden = true;
        document.getElementById("wireless-panel").hidden = true;
        document.getElementById("test-panel").hidden = false;
        document.querySelector("#test-panel h1").textContent =
            t(family === "one" ? "wirelessTestTitle" : "testTitle");
        document.getElementById("test-close").textContent =
            t(family === "one" ? "wirelessTestClose" : "close");
        document.getElementById("test-close").focus();
        document.getElementById("pad-status").textContent = t("permissions");
        document.getElementById("pad-values").textContent = t("press");
        function failure(response) {
            clearTimeout(inputTimer);
            if (testing) {
                document.getElementById("pad-status").textContent =
                    window.i18n.error(response, "inputError");
            }
        }
        if (!window.webOS || !webOS.service) {
            failure({errorKey: "tvOnly"});
            return;
        }
        elevate(function () {
            if (!testing) { return; }
            document.getElementById("pad-status").textContent = t("reading");
            subscription = request("luna://com.paolo.xboxleds.service", {
                method: family === "one" ? "watchWirelessInput" : "watchInput",
                parameters: {subscribe: true}, subscribe: true,
                onSuccess: renderPads, onFailure: failure
            });
            inputTimer = setTimeout(function () {
                if (subscription) { subscription.cancel(); subscription = null; }
                failure({errorKey: "inputError"});
            }, 10000);
        }, failure);
    }

    buttons[0].onclick = function () { setLed("auto", buttons[0]); };
    buttons[1].onclick = function () { setLed("off", buttons[1]); };
    buttons[2].onclick = function () { openTest("360"); };
    function updateDriver(response) {
        driverState = response;
        document.getElementById("driver-start").disabled = busy || response.running;
        document.getElementById("driver-pair").disabled = busy || !response.ready;
        document.getElementById("wireless-test").disabled = busy || !response.ready;
        document.getElementById("driver-stop").disabled = busy || !response.running;
    }
    function driverAction(action, button) {
        if (busy) { return; }
        var label = document.getElementById("wireless-status");
        if (!window.webOS || !webOS.service) {
            label.textContent = t("tvOnly");
            return;
        }
        busy = true;
        updateDriver(driverState);
        document.getElementById("wireless-close").disabled = true;
        label.className = "";
        label.textContent = t("driverWorking");
        function done(response, error) {
            busy = false;
            document.getElementById("wireless-close").disabled = false;
            updateDriver(typeof response.running === "boolean" ? response : driverState);
            label.className = error ? "error" : "";
            label.textContent = error ? window.i18n.error(response, "driverError") :
                t(action === "pair" ? "pairingEnabled" :
                    response.running ? response.ready ? "driverRunning" : "driverWaiting" : "driverStopped");
            if (button) {
                (button.disabled ? document.getElementById("wireless-close") : button).focus();
            }
        }
        elevate(function () {
            request("luna://com.paolo.xboxleds.service", {
                method: "wirelessDriver", parameters: {action: action}, timeout: 20,
                onSuccess: function (response) { done(response, false); },
                onFailure: function (response) { done(response, true); }
            });
        }, function () { done({errorKey: "rootError"}, true); });
    }
    function closeWireless() {
        wirelessPage = false;
        document.getElementById("wireless-panel").hidden = true;
        document.getElementById("led-panel").hidden = false;
        buttons[3].focus();
    }
    buttons[3].onclick = function () {
        wirelessPage = true;
        document.getElementById("led-panel").hidden = true;
        document.getElementById("wireless-panel").hidden = false;
        document.getElementById("wireless-close").focus();
        driverAction("status");
    };
    document.getElementById("driver-start").onclick = function () { driverAction("start", this); };
    document.getElementById("driver-pair").onclick = function () { driverAction("pair", this); };
    document.getElementById("driver-stop").onclick = function () { driverAction("stop", this); };
    document.getElementById("wireless-test").onclick = function () { openTest("one"); };
    document.getElementById("wireless-close").onclick = closeWireless;
    document.getElementById("test-close").onclick = closeTest;
    window.addEventListener("beforeunload", function () {
        if (subscription) { subscription.cancel(); }
        clearTimeout(inputTimer);
        window.requestService.cancelAll();
    });
    document.addEventListener("keydown", function (event) {
        if (event.keyCode === 461) {
            event.preventDefault();
            if (testing) { closeTest(); }
            else if (!busy && wirelessPage) { closeWireless(); }
            else if (!busy) { window.close(); }
        } else if (!busy && !testing && (event.keyCode === 37 || event.keyCode === 39 ||
                event.keyCode === 38 || event.keyCode === 40)) {
            event.preventDefault();
            var panel = document.getElementById(wirelessPage ? "wireless-panel" : "led-panel");
            var activeButtons = buttons.filter(function (button) {
                return panel.contains(button) && !button.disabled;
            });
            var current = activeButtons.indexOf(document.activeElement);
            var direction = event.keyCode === 37 || event.keyCode === 38 ? -1 : 1;
            activeButtons[(Math.max(0, current) + direction + activeButtons.length) % activeButtons.length].focus();
        }
    });
    buttons[0].focus();
}());
