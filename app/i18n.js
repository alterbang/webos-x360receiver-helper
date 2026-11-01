(function (root) {
    "use strict";
    var strings = {
        en: {
            intro: "Connect the USB receiver and turn on the controller.\nThen choose the controller LED mode.",
            off: "LEDs off", auto: "Auto-assign LEDs 1–4",
            test: "Controller test", ready: "Ready.",
            notes: "Requires a rooted TV and Homebrew Channel.\nThe controller briefly disconnects during LED commands. If needed, reopen it in the app you're using.\nAuto-assign maps receiver slots 1–4 to their matching LEDs. Repeat after powering on or reconnecting.\nPress Back to exit.",
            testBadge: "LIVE INPUT TEST", testTitle: "Test your controller",
            reading: "Preparing input reader...", padLabel: "Controller outline showing active inputs",
            press: "Press a button or move a stick.", close: "Back to LEDs",
            testNotes: "Read-only monitoring: does not grab the controller or change LEDs.\nWith multiple controllers, the most recently used one is shown.",
            tvOnly: "Open this application on a webOS TV.",
            permissions: "Preparing USB permissions...", sending: "Sending command to receiver...",
            sentOff: "Command sent: LEDs off.",
            sentAuto: "LEDs assigned by receiver slot: 1→1, 2→2, 3→3, 4→4.",
            usbError: "USB command failed.", rootError: "USB permissions unavailable. Check Homebrew Channel and root.",
            receiverMissing: "Receiver not found. Connect the USB receiver.",
            receiverPresent: "Receiver present | Slot ", events: " | Input events: ",
            pressPad: " | Press a controller button", keys: "Buttons: ", leftStick: "Left stick: ",
            rightStick: "Right stick: ", inputError: "Input unavailable. Reopen the test.",
            invalidMode: "Invalid LED mode.", busy: "A LED command is already running."
        },
        it: {
            intro: "Collega il ricevitore USB e accendi il controller.\nPoi scegli come illuminare il pad.",
            off: "LED spenti", auto: "LED automatici 1–4",
            test: "Test del pad", ready: "Pronto.",
            notes: "Richiede TV con root e Homebrew Channel.\nIl pad si disconnette brevemente durante il comando LED. Se necessario, riaprilo nell'app che stai usando.\nL'assegnazione automatica associa gli slot 1–4 ai rispettivi LED. Ripetila dopo una nuova accensione o riconnessione.\nPremi Indietro per uscire.",
            testBadge: "TEST IN TEMPO REALE", testTitle: "Prova il controller",
            reading: "Preparazione della lettura...", padLabel: "Profilo del controller con comandi attivi",
            press: "Premi un tasto o muovi uno stick.", close: "Torna ai LED",
            testNotes: "Lettura passiva: non blocca il pad e non cambia i LED.\nCon piu pad, viene mostrato quello usato per ultimo.",
            tvOnly: "Apri questa applicazione sulla TV webOS.",
            permissions: "Preparazione dei permessi USB...", sending: "Invio del comando al ricevitore...",
            sentOff: "Comando inviato: LED spenti.",
            sentAuto: "LED assegnati per slot: 1→1, 2→2, 3→3, 4→4.",
            usbError: "Comando USB non riuscito.", rootError: "Permessi USB non disponibili. Verifica Homebrew Channel e root.",
            receiverMissing: "Ricevitore non trovato. Collega il ricevitore USB.",
            receiverPresent: "Ricevitore presente | Slot ", events: " | Input ricevuti: ",
            pressPad: " | Premi un tasto del pad", keys: "Tasti: ", leftStick: "Stick L: ",
            rightStick: "Stick R: ", inputError: "Lettura non disponibile. Riapri il test.",
            invalidMode: "Modalita LED non valida.", busy: "Un comando LED e gia in corso."
        }
    };

    function language(locale) {
        return /^it(?:[-_]|$)/i.test(typeof locale === "string" ? locale : "") ? "it" : "en";
    }

    function create(locale) {
        var selected = language(locale);
        return {
            language: selected,
            t: function (key) { return strings[selected][key] || strings.en[key] || key; },
            error: function (response, fallback) {
                return this.t(response && response.errorKey || fallback);
            }
        };
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = {create: create, language: language};
    } else {
        root.i18n = create(root.PalmSystem && root.PalmSystem.locale || root.navigator.language);
        root.document.documentElement.lang = root.i18n.language;
        Array.prototype.forEach.call(root.document.querySelectorAll("[data-i18n]"), function (node) {
            node.textContent = root.i18n.t(node.getAttribute("data-i18n"));
        });
        root.document.getElementById("pad").setAttribute("aria-label", root.i18n.t("padLabel"));
    }
}(this));
