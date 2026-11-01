(function () {
    "use strict";
    var buttons = [document.getElementById("player1"), document.getElementById("off"),
        document.getElementById("test")];
    var status = document.getElementById("status");
    var busy = false;
    var subscription = null;
    var testing = false;
    var selectedSlot = null;
    var eventCounts = {};

    function elevate(success, failure) {
        webOS.service.request("luna://org.webosbrew.hbchannel.service", {
            method: "elevateService",
            parameters: {id: "com.paolo.xboxleds.service"},
            timeout: 15,
            onSuccess: success,
            onFailure: failure
        });
    }

    function finish(text, error, button) {
        busy = false;
        buttons.forEach(function (item) { item.disabled = false; });
        status.textContent = text;
        status.className = error ? "error" : "";
        button.focus();
    }

    function setLed(mode, button) {
        if (busy) { return; }
        if (!window.webOS || !webOS.service) {
            finish("Apri questa applicazione sulla TV webOS.", true, button);
            return;
        }
        busy = true;
        buttons.forEach(function (item) { item.disabled = true; });
        status.className = "";
        status.textContent = "Preparazione dei permessi USB...";
        elevate(function () {
                status.textContent = "Invio del comando al ricevitore...";
                webOS.service.request("luna://com.paolo.xboxleds.service", {
                    method: "setLed",
                    parameters: {mode: mode},
                    timeout: 20,
                    onSuccess: function () {
                        finish(mode === "off" ? "Comando inviato: LED spenti." :
                            "Comando inviato: LED 1 fisso.", false, button);
                    },
                    onFailure: function (response) {
                        finish(response.errorText || "Comando USB non riuscito.", true, button);
                    }
                });
            }, function (response) {
                finish("Permessi USB non disponibili. Verifica Homebrew Channel e root.\n" +
                    (response.errorText || ""), true, button);
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
        var pads = response.pads || [];
        var label = document.getElementById("pad-status");
        if (!pads.length) {
            clearPad();
            selectedSlot = null;
            eventCounts = {};
            label.textContent = "Ricevitore non trovato. Collega il ricevitore USB.";
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
        label.textContent = "Ricevitore presente | Slot " + selected.slot +
            (selected.events ? " | Input ricevuti: " + selected.events : " | Premi un tasto del pad");
        var pressed = Object.keys(state.buttons).filter(function (name) { return state.buttons[name]; });
        document.getElementById("pad-values").textContent =
            "Tasti: " + (pressed.join(", ").toUpperCase() || "-") +
            " | LT " + Math.round(state.lt * 100) + "% | RT " + Math.round(state.rt * 100) + "%\n" +
            "Stick L: " + state.left.map(function (v) { return v.toFixed(2); }).join(", ") +
            " | Stick R: " + state.right.map(function (v) { return v.toFixed(2); }).join(", ");
    }

    function closeTest() {
        testing = false;
        if (subscription) { subscription.cancel(); subscription = null; }
        document.getElementById("test-panel").hidden = true;
        document.getElementById("led-panel").hidden = false;
        buttons[2].focus();
    }

    function openTest() {
        if (busy) { return; }
        testing = true;
        selectedSlot = null;
        eventCounts = {};
        clearPad();
        document.getElementById("led-panel").hidden = true;
        document.getElementById("test-panel").hidden = false;
        document.getElementById("test-close").focus();
        document.getElementById("pad-status").textContent = "Preparazione della lettura...";
        function failure(response) {
            if (testing) {
                document.getElementById("pad-status").textContent =
                    response.errorText || "Lettura non disponibile. Riapri il test.";
            }
        }
        if (!window.webOS || !webOS.service) {
            failure({errorText: "Apri questa applicazione sulla TV webOS."});
            return;
        }
        elevate(function () {
            if (!testing) { return; }
            subscription = webOS.service.request("luna://com.paolo.xboxleds.service", {
                method: "watchInput", parameters: {subscribe: true}, subscribe: true,
                onSuccess: renderPads, onFailure: failure
            });
        }, failure);
    }

    buttons[0].onclick = function () { setLed("player1", buttons[0]); };
    buttons[1].onclick = function () { setLed("off", buttons[1]); };
    buttons[2].onclick = openTest;
    document.getElementById("test-close").onclick = closeTest;
    window.addEventListener("beforeunload", function () {
        if (subscription) { subscription.cancel(); }
    });
    document.addEventListener("keydown", function (event) {
        if (event.keyCode === 461) {
            event.preventDefault();
            if (testing) { closeTest(); }
            else if (!busy) { window.close(); }
        } else if (!busy && !testing && (event.keyCode === 37 || event.keyCode === 39 ||
                event.keyCode === 38 || event.keyCode === 40)) {
            event.preventDefault();
            var current = buttons.indexOf(document.activeElement);
            var direction = event.keyCode === 37 || event.keyCode === 38 ? -1 : 1;
            buttons[(Math.max(0, current) + direction + buttons.length) % buttons.length].focus();
        }
    });
    buttons[0].focus();
}());
