#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
build="$root/.build/wireless"
out="$root/service/native"
revision=d335d6024f8380f52767a7de67727d9b2f867871
mkdir -p "$build" "$out"
if [ -z "${ZIG:-}" ]; then
    if command -v zig >/dev/null 2>&1; then
        ZIG=$(command -v zig)
    else
        case "$(uname -sm)" in
            "Linux x86_64") ;;
            *) echo "Set ZIG to a Zig 0.13.0 executable." >&2; exit 1 ;;
        esac
        if [ ! -x "$build/zig-linux-x86_64-0.13.0/zig" ]; then
            curl -fLsS https://ziglang.org/download/0.13.0/zig-linux-x86_64-0.13.0.tar.xz -o "$build/zig.tar.xz"
            tar -xf "$build/zig.tar.xz" -C "$build"
        fi
        ZIG="$build/zig-linux-x86_64-0.13.0/zig"
    fi
fi
if [ ! -d "$build/xow" ]; then
    curl -fLsS "https://codeload.github.com/medusalix/xow/tar.gz/$revision" -o "$build/xow.tar.gz"
    mkdir "$build/xow"
    tar -xf "$build/xow.tar.gz" -C "$build/xow" --strip-components=1
    patch -d "$build/xow" -p1 < "$root/scripts/xow-legacy-uinput.patch"
fi
for file in xow-no-rumble.patch xow-diagnostics.patch; do
    if patch -d "$build/xow" -p1 --dry-run --forward --batch < "$root/scripts/$file" >/dev/null 2>&1; then
        patch -d "$build/xow" -p1 --forward --batch < "$root/scripts/$file"
    elif ! patch -d "$build/xow" -p1 --dry-run --reverse --batch < "$root/scripts/$file" >/dev/null 2>&1; then
        echo "Cannot apply or verify $file." >&2
        exit 1
    fi
done
if [ ! -d "$build/libusb-1.0.27" ]; then
    curl -fLsS https://github.com/libusb/libusb/releases/download/v1.0.27/libusb-1.0.27.tar.bz2 -o "$build/libusb.tar.bz2"
    tar -xf "$build/libusb.tar.bz2" -C "$build"
fi
if [ ! -f "$build/lib/lib/libusb-1.0.a" ]; then
    cd "$build/libusb-1.0.27"
    ./configure --host=arm-linux-musleabi --disable-udev --disable-shared --enable-static \
        --prefix="$build/lib" CC="$ZIG cc -target arm-linux-musleabi -mcpu=cortex_a9" \
        AR="$ZIG ar" RANLIB="$ZIG ranlib"
    make -j2
    make install
fi
cd "$build/xow"
make -j2 xow BUILD=RELEASE VERSION="webos-$revision" \
    FIRMWARE=/media/developer/xbox-wireless/xow_dongle.bin \
    CXX="$ZIG c++ -target arm-linux-musleabi -mcpu=cortex_a9" \
    CPPFLAGS="-I$build/lib/include" LDFLAGS="-static -L$build/lib/lib"
"$ZIG" objcopy --strip-debug xow "$out/xow"
# Include corresponding source and build recipe with the GPL/LGPL executable.
cp LICENSE "$out/XOW-LICENSE"
cp "$build/libusb-1.0.27/COPYING" "$out/LIBUSB-LICENSE"
cp "$root/scripts/build-wireless.sh" "$root/scripts/xow-legacy-uinput.patch" \
    "$root/scripts/xow-no-rumble.patch" "$root/scripts/xow-diagnostics.patch" "$out/"
cp "$build/xow.tar.gz" "$out/xow-source.tar.gz"
cp "$build/libusb.tar.bz2" "$out/libusb-source.tar.bz2"
zigdir=$(dirname "$ZIG")
cp "$zigdir/lib/libc/musl/COPYRIGHT" "$out/MUSL-LICENSE"
cp "$zigdir/lib/libcxx/LICENSE.TXT" "$out/LIBCXX-LICENSE"
cp "$zigdir/lib/libcxxabi/LICENSE.TXT" "$out/LIBCXXABI-LICENSE"
cp "$zigdir/lib/libunwind/LICENSE.TXT" "$out/LIBUNWIND-LICENSE"
