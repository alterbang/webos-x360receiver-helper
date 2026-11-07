from __future__ import print_function
import errno
import ctypes as C
import glob
import os
import select
import struct
import sys
import time

EVENT = struct.Struct("llHHi")
devices = {}
family = sys.argv[1] if len(sys.argv) > 1 else "360"
libc = C.CDLL(None, use_errno=True)
libc.ioctl.argtypes = [C.c_int, C.c_ulong, C.c_void_p]


def ioctl(fd, request, size):
    buffer = C.create_string_buffer(size)
    if libc.ioctl(fd, request, buffer) < 0:
        number = C.get_errno()
        raise OSError(number, os.strerror(number))
    return buffer.raw


def snapshot(device):
    def values(items):
        return ",".join('"%s":%d' % (key, value) for key, value in items.items())
    # The TV's minimal Python has no json module; all fields here are numeric.
    return '{"slot":%d,"keys":{%s},"axes":{%s},"axisMax":{%s},"events":%d}' % (
        device["slot"], values(device["keys"]), values(device["axes"]),
        values(device["axisMax"]), device["events"])


def open_device(path, slot):
    fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK)
    device = {"fd": fd, "slot": slot, "keys": {}, "axes": {}, "axisMax": {}, "events": 0}
    try:
        keys = ioctl(fd, 0x80804518, 128)
        for code in (304, 305, 307, 308, 310, 311, 314, 315, 316, 317, 318,
                     704, 705, 706, 707):
            device["keys"][str(code)] = bool(ord(keys[code // 8:code // 8 + 1]) &
                                                  (1 << (code % 8)))
        for code in (0, 1, 2, 3, 4, 5, 16, 17):
            try:
                info = struct.unpack("iiiiii", ioctl(fd, 0x80184540 + code, 24))
                device["axes"][str(code)] = info[0]
                device["axisMax"][str(code)] = info[2]
            except (IOError, OSError):
                pass
    except Exception:
        os.close(fd)
        raise
    return device


def discover():
    found = {}
    for event in sorted(glob.glob("/sys/class/input/event*")):
        try:
            name = open(event + "/device/name").read().strip()
            real = os.path.realpath(event + "/device")
            if family == "one":
                if name != "Microsoft X-Box 360 pad" or "/virtual/input/" not in real:
                    continue
                slot = len(found) + 1
            else:
                if not name.startswith("Xbox 360 Wireless Receiver"):
                    continue
                # Receiver gamepad interfaces are 0, 2, 4 and 6.
                interface = int(real.split(":1.")[1].split("/")[0])
                slot = interface // 2 + 1
            found["/dev/input/" + os.path.basename(event)] = slot
        except (IOError, ValueError, IndexError):
            continue
    for path in list(devices):
        if path not in found:
            os.close(devices.pop(path)["fd"])
    for path, slot in found.items():
        if path not in devices:
            try:
                devices[path] = open_device(path, slot)
            except (IOError, OSError):
                pass
        else:
            devices[path]["slot"] = slot


last_output = None
next_scan = 0
try:
    while True:
        now = time.time()
        if now >= next_scan:
            discover()
            next_scan = now + 1
        fds = [device["fd"] for device in devices.values()]
        ready, _, _ = select.select(fds, [], [], 0.04)
        for path, device in list(devices.items()):
            if device["fd"] not in ready:
                continue
            try:
                data = os.read(device["fd"], EVENT.size * 64)
                if not data:
                    os.close(devices.pop(path)["fd"])
                    continue
                for offset in range(0, len(data), EVENT.size):
                    _, _, kind, code, value = EVENT.unpack(data[offset:offset + EVENT.size])
                    if kind == 1:
                        device["keys"][str(code)] = bool(value)
                    elif kind == 3:
                        device["axes"][str(code)] = value
                    elif kind == 0 and code == 3:
                        # Resynchronise after an evdev queue overflow.
                        os.close(devices.pop(path)["fd"])
                        break
                    else:
                        continue
                    device["events"] += 1
            except OSError as error:
                if error.errno not in (errno.EAGAIN, errno.EWOULDBLOCK):
                    os.close(devices.pop(path)["fd"])
        output = '{"pads":[' + ",".join(
            snapshot(device) for device in sorted(devices.values(), key=lambda d: d["slot"])
        ) + "]}"
        if output != last_output:
            print(output)
            last_output = output
finally:
    for device in devices.values():
        os.close(device["fd"])
