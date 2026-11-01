from __future__ import print_function
import ctypes as C
import sys

command = int(sys.argv[1])
if command not in (0, 6):
    raise ValueError("Only LED off (0) and player 1 (6) are supported")

usb = C.CDLL("/lib/libusb-1.0.so.0")
usb.libusb_init.argtypes = [C.POINTER(C.c_void_p)]
usb.libusb_open_device_with_vid_pid.argtypes = [C.c_void_p, C.c_uint16, C.c_uint16]
usb.libusb_open_device_with_vid_pid.restype = C.c_void_p
for name in ("kernel_driver_active", "detach_kernel_driver", "attach_kernel_driver",
             "claim_interface", "release_interface"):
    getattr(usb, "libusb_" + name).argtypes = [C.c_void_p, C.c_int]
usb.libusb_interrupt_transfer.argtypes = [
    C.c_void_p, C.c_ubyte, C.POINTER(C.c_ubyte), C.c_int,
    C.POINTER(C.c_int), C.c_uint]
usb.libusb_close.argtypes = [C.c_void_p]
usb.libusb_exit.argtypes = [C.c_void_p]


def check(result, operation):
    if result < 0:
        raise RuntimeError("%s: libusb error %d" % (operation, result))


context = C.c_void_p()
check(usb.libusb_init(C.byref(context)), "init")
handle = None
try:
    for product in (0x0291, 0x0719):
        handle = usb.libusb_open_device_with_vid_pid(context, 0x045e, product)
        if handle:
            break
    if not handle:
        raise RuntimeError("Xbox 360 receiver not found. Connect the USB receiver.")
    packet = (C.c_ubyte * 12)(0, 0, 8, 0x40 + command, 0, 0, 0, 0, 0, 0, 0, 0)
    for interface, endpoint in ((0, 1), (2, 3), (4, 5), (6, 7)):
        detached = False
        claimed = False
        try:
            active = usb.libusb_kernel_driver_active(handle, interface)
            check(active, "driver status")
            if active:
                check(usb.libusb_detach_kernel_driver(handle, interface), "detach")
                detached = True
            check(usb.libusb_claim_interface(handle, interface), "claim")
            claimed = True
            transferred = C.c_int()
            check(usb.libusb_interrupt_transfer(
                handle, endpoint, packet, len(packet), C.byref(transferred), 1000),
                "LED transfer")
            if transferred.value != len(packet):
                raise RuntimeError("Incomplete LED command")
            print("Slot %d: LED command %d sent" % (interface // 2 + 1, command))
        finally:
            try:
                if claimed:
                    check(usb.libusb_release_interface(handle, interface), "release")
            finally:
                if detached:
                    check(usb.libusb_attach_kernel_driver(handle, interface), "reattach")
                    print("Interface %d: xpad restored" % interface)
finally:
    if handle:
        usb.libusb_close(handle)
    usb.libusb_exit(context)
