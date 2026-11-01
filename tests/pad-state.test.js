const test = require("node:test");
const assert = require("node:assert/strict");
const decode = require("../app/pad-state");

test("Xbox evdev buttons and D-pad map to the outline", () => {
    const state = decode({keys: {304: true, 307: true, 317: true, 707: true}, axes: {16: -1}});
    assert.equal(state.buttons.a, true);
    assert.equal(state.buttons.x, true);
    assert.equal(state.buttons.ls, true);
    assert.equal(state.buttons.down, true);
    assert.equal(state.buttons.left, true);
    assert.equal(state.buttons.b, false);
    assert.equal(decode({}).buttons.a, false);
});

test("Xbox sticks preserve direction and triggers have independent ranges", () => {
    const state = decode({axes: {0: -32768, 1: 16384, 3: 32767, 4: -16384, 2: 255, 5: 128}});
    assert.deepEqual(state.left, [-1, 0.5]);
    assert.ok(state.right[0] > 0.99);
    assert.equal(state.right[1], -0.5);
    assert.equal(state.lt, 1);
    assert.equal(state.rt, 128 / 255);
});
