# webos-x360receiver-helper

**Xbox LED** is a manually launched helper for Xbox wireless receivers on rooted
LG webOS TVs, with Xbox 360 LED control and experimental Xbox One / Series support.

Some LG kernels support Xbox controller input but omit `CONFIG_JOYSTICK_XPAD_LEDS`,
leaving all four LEDs blinking even when the controller works. This app can turn
the LEDs off or assign each receiver slot to its matching player LED (slot 1 →
LED 1, through slot 4 → LED 4), without replacing the kernel.

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

LED commands briefly detach and restore the receiver's gamepad interfaces.
The LEDs-off command applies to every slot; auto-assignment sets each slot's
matching player LED independently. Reopen the app using the controller if
needed. Repeat the command after powering on or reconnecting the controller.
The tester only reads input and stops when you leave the test screen. Nothing
is installed as a boot-time helper.

## Experimental Xbox One / Series wireless support

The **Xbox One / Series** section runs an ARMv7 driver based on
[xow](https://github.com/medusalix/xow),
using libusb and the legacy `uinput_user_dev` interface instead of xow's
Linux 4.5+ setup ioctls, was tested on the Linux 4.4.3 TV described above.
The Microsoft adapter `045e:02e6` paired with a Series controller `045e:0b12`
(firmware 5.9.2709.0), and evdev reported buttons, D-pad, full stick ranges,
and triggers. The driver uses xow's Xbox 360 compatibility mode.

The adapter firmware is **not included** in the package. Provision it once from a
Linux computer with `curl`, `cabextract`, `sha256sum`, and SSH access to the rooted
TV. Read [Microsoft's terms](https://www.microsoft.com/en-us/legal/terms-of-use)
before accepting them with the flag below:

```sh
sh scripts/provision-wireless-firmware.sh --accept-ms-terms TV_HOST SSH_KEY
```

This stores the verified firmware in
`/media/developer/xbox-wireless/xow_dongle.bin`, separately from the app.
Open **Xbox One / Series**, select **Start driver**, then **Pair controller**
and put the controller in pairing mode. **Controller test** uses the same live
outline as the Xbox 360 tester, with the correct Series trigger ranges.

The driver stays active when you leave the test or close the app, so other apps
can use the controller. **Stop driver** stops it; a TV reboot also stops it.
Nothing starts automatically at boot. Stop the driver before unplugging the
adapter. Logs are kept locally in `/media/developer/xbox-wireless/driver.log`
and may contain controller identifiers. Version 1.7.0 keeps force feedback and
targeted diagnostics (`XOW_DIAGNOSTICS=1`): disassociation frames, firmware
`CLIENT_LOST` events, raw radio samples at most every five seconds, and feedback
teardown steps. Raw RSSI bytes are not calibrated dBm readings.

Version 1.7.0 ports xone's receiver idle-time command (`0x05`, value 64), sent
during initialization to reduce disconnections while the controller is idle.
It also avoids a Linux 4.4 uinput deadlock: `UI_DEV_DESTROY` holds the uinput
lock while removing a device with uploaded force-feedback effects, and the
effect erase then waits for the same lock. The driver now closes the uinput
descriptor instead, which destroys the device without holding that lock. If an
older driver is already blocked in `uinput_request_submit`, **Stop driver**
refuses to signal it; fully reboot the TV instead. These fixes still need a
long on-TV pause test.
Compatibility with individual games
and other adapter/controller firmware versions remains unverified.
The original Xbox 360 LED controls and test remain separate.

## Build

With Node.js 20+, Linux, `curl`, `tar`, `patch`, and `make`:

```sh
npm ci
npm test
npm run package
npx ares-install --device YOUR_TV dist/com.paolo.xboxleds_1.7.0_all.ipk
```

Configure `YOUR_TV` with `ares-setup-device` first. Packages are generated in
`dist/`. Packaging builds the static ARMv7 driver from pinned xow and libusb
sources in `.build/wireless`, and includes their sources and license notices.
On Linux x86-64, the build downloads Zig 0.13.0 if it is unavailable; otherwise
set `ZIG` to that compiler's executable. Generated files in `service/native`
are not committed. No Microsoft firmware is downloaded during packaging.
Icons can be regenerated with `python3 scripts/render-icons.py`
(requires Pillow).
