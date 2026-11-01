# webos-x360receiver-helper

**Xbox LED** is a small, manually launched helper for Xbox 360 wireless
receivers on rooted LG webOS TVs.

Some LG kernels support Xbox controller input but omit `CONFIG_JOYSTICK_XPAD_LEDS`,
leaving all four LEDs blinking even when the controller works. This app can turn
the LEDs off or set LED 1 steadily on, without replacing the kernel.

It also includes a live controller outline showing buttons, D-pad, stick movement
and trigger levels. The interface uses Italian when the TV locale is Italian,
and English for all other languages.

## Requirements and use

A rooted TV with Homebrew Channel, working `xpad` support, Python with `ctypes`,
and `libusb-1.0.so.0` are required. Receiver IDs `045e:0291` and `045e:0719` are
supported for LED commands. Tested on an ARMv7 TV with Linux 4.4.3 and receiver
`045e:0291`; compatibility with other TVs is not guaranteed.

Install the `.ipk`, connect the receiver, turn on the controller, then open
**Xbox LED** and select a LED mode or **Controller test**.

LED commands briefly detach and restore the receiver's gamepad interfaces and
apply to all controllers on that receiver. Restart the Moonlight session if
needed. Repeat the command after powering on or reconnecting the controller.
The tester only reads input and stops when you leave the test screen. Nothing
is installed as a boot-time helper.

## Build

With Node.js 20+:

```sh
npm ci
npm test
npm run package
npx ares-install --device YOUR_TV dist/com.paolo.xboxleds_1.2.0_all.ipk
```

Configure `YOUR_TV` with `ares-setup-device` first. Packages are generated in
`dist/`. Icons can be regenerated with `python3 scripts/render-icons.py`
(requires Pillow).
