const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const i18n = require("../app/i18n");

test("Italian TV locales use Italian; every other locale uses English", () => {
    for (const locale of ["it", "it-IT", "it_CH", "IT-it"]) {
        assert.equal(i18n.create(locale).t("off"), "LED spenti");
    }
    for (const locale of ["en-US", "de-DE", "fr-FR", "", undefined, "italian"]) {
        assert.equal(i18n.create(locale).t("off"), "LEDs off");
    }
});

test("static labels and service errors are translated in both languages", () => {
    const html = fs.readFileSync("app/index.html", "utf8");
    const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => match[1]);
    for (const locale of ["it-IT", "en-US"]) {
        const translator = i18n.create(locale);
        for (const key of keys) { assert.notEqual(translator.t(key), key); }
        assert.equal(translator.error({errorKey: "rootError"}, "usbError"), translator.t("rootError"));
        assert.equal(translator.error({errorText: "native diagnostic"}, "usbError"), translator.t("usbError"));
    }
});

test("automatic assignment is the first action and instructions are app-neutral", () => {
    const html = fs.readFileSync("app/index.html", "utf8");
    const buttons = [...html.matchAll(/<button id="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(buttons.slice(0, 3), ["auto", "off", "test"]);
    for (const file of ["app/index.html", "app/i18n.js", "README.md"]) {
        assert.doesNotMatch(fs.readFileSync(file, "utf8"), /Moonlight/i);
    }
});
