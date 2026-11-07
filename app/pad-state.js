(function (root) {
    "use strict";
    function decode(pad) {
        var keys = pad.keys || {};
        var axes = pad.axes || {};
        var codes = {
            a: 304, b: 305, x: 307, y: 308, lb: 310, rb: 311,
            back: 314, start: 315, guide: 316, ls: 317, rs: 318,
            up: 706, down: 707, left: 704, right: 705
        };
        var buttons = {};
        Object.keys(codes).forEach(function (name) { buttons[name] = !!keys[codes[name]]; });
        buttons.left = buttons.left || axes[16] < 0;
        buttons.right = buttons.right || axes[16] > 0;
        buttons.up = buttons.up || axes[17] < 0;
        buttons.down = buttons.down || axes[17] > 0;
        function axis(code) {
            return Math.max(-1, Math.min(1, (axes[code] || 0) / 32768));
        }
        function trigger(code) {
            var maximum = pad.axisMax && pad.axisMax[code] > 0 ? pad.axisMax[code] : 255;
            return Math.max(0, Math.min(1, (axes[code] || 0) / maximum));
        }
        return {
            buttons: buttons, left: [axis(0), axis(1)], right: [axis(3), axis(4)],
            lt: trigger(2), rt: trigger(5)
        };
    }
    if (typeof module !== "undefined" && module.exports) { module.exports = decode; }
    else { root.decodePad = decode; }
}(this));
