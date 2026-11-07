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
            invalidMode: "Invalid LED mode.", busy: "A LED command is already running.",
            wirelessSection: "Xbox One / Series", wirelessTitle: "Xbox One / Series receiver",
            wirelessIntro: "Experimental Microsoft wireless adapter support. Start the driver, then pair your controller.\nVibration enabled; targeted diagnostic logging active.",
            driverStart: "Start driver", driverPair: "Pair controller", driverStop: "Stop driver",
            wirelessClose: "Back to Xbox 360", wirelessTestClose: "Back to Xbox One / Series",
            wirelessTestTitle: "Test Xbox One / Series",
            wirelessNotes: "The driver stays active when you close the test or app, until Stop or a TV reboot.\nStop it here before unplugging the adapter. No automatic startup.\nMicrosoft firmware must be provisioned separately; see the README.",
            driverStopped: "Driver stopped.", driverRunning: "Driver active. Ready to pair or test.",
            driverWaiting: "Driver waiting for the receiver.", driverWorking: "Preparing wireless driver...",
            pairingEnabled: "Pairing enabled. Hold the controller pairing button.",
            wirelessMissing: "No wireless controller connected. Start the driver and pair your controller.",
            firmwareMissing: "Microsoft firmware is missing. Run scripts/provision-wireless-firmware.sh as described in the README.",
            driverMissing: "Driver missing from package. Rebuild with npm run package.",
            driverError: "Wireless driver failed. Check the adapter and restart the driver.",
            driverNotReady: "Receiver did not initialize. Reconnect it and restart the driver.",
            driverNotRunning: "Start the driver before pairing.", driverBusy: "A driver operation is already running.",
            invalidDriverAction: "Invalid driver operation.",
            requestTimeout: "Service did not respond. Reopen the section and retry.",
            serviceError: "Invalid service response. Reopen the app."
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
            invalidMode: "Modalita LED non valida.", busy: "Un comando LED e gia in corso.",
            wirelessSection: "Xbox One / Series", wirelessTitle: "Ricevitore Xbox One / Series",
            wirelessIntro: "Supporto sperimentale per il ricevitore wireless Microsoft. Avvia il driver, poi associa il controller.\nVibrazione abilitata; log diagnostici mirati attivi.",
            driverStart: "Avvia driver", driverPair: "Associa controller", driverStop: "Arresta driver",
            wirelessClose: "Torna a Xbox 360", wirelessTestClose: "Torna a Xbox One / Series",
            wirelessTestTitle: "Prova Xbox One / Series",
            wirelessNotes: "Il driver resta attivo quando chiudi il test o l'app, fino ad Arresta o al riavvio TV.\nArrestalo qui prima di scollegare il ricevitore. Nessun avvio automatico.\nIl firmware Microsoft va preparato separatamente; vedi il README.",
            driverStopped: "Driver arrestato.", driverRunning: "Driver attivo. Puoi associare o provare il controller.",
            driverWaiting: "Driver in attesa del ricevitore.", driverWorking: "Preparazione del driver wireless...",
            pairingEnabled: "Associazione attiva. Tieni premuto il tasto di associazione del controller.",
            wirelessMissing: "Nessun controller wireless collegato. Avvia il driver e associa il controller.",
            firmwareMissing: "Firmware Microsoft mancante. Esegui scripts/provision-wireless-firmware.sh come descritto nel README.",
            driverMissing: "Driver assente dal pacchetto. Ricompila con npm run package.",
            driverError: "Errore del driver wireless. Controlla il ricevitore e riavvia il driver.",
            driverNotReady: "Ricevitore non inizializzato. Ricollegalo e riavvia il driver.",
            driverNotRunning: "Avvia il driver prima dell'associazione.", driverBusy: "Un'operazione del driver e gia in corso.",
            invalidDriverAction: "Operazione driver non valida.",
            requestTimeout: "Il servizio non risponde. Riapri la sezione e riprova.",
            serviceError: "Risposta del servizio non valida. Riapri l'app."
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
