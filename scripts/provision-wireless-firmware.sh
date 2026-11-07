#!/bin/sh
set -eu
if [ "${1:-}" != "--accept-ms-terms" ] || [ -z "${2:-}" ]; then
    echo "Usage: sh $0 --accept-ms-terms TV_HOST [SSH_KEY]" >&2
    echo "Microsoft terms: https://www.microsoft.com/en-us/legal/terms-of-use" >&2
    exit 1
fi
host=$2
key=${3:-"$HOME/.ssh/webos_ubuntu_sb2"}
cabextract=${CABEXTRACT:-cabextract}
work=$(mktemp -d)
trap 'rm -f "$work/driver.cab" "$work/FW_ACC_00U.bin"; rmdir "$work"' EXIT
curl -fLsS https://catalog.s.download.windowsupdate.com/c/msdownload/update/driver/drvs/2017/07/1cd6a87c-623f-4407-a52d-c31be49e925c_e19f60808bdcbfbd3c3df6be3e71ffc52e43261e.cab -o "$work/driver.cab"
"$cabextract" -q -d "$work" -F FW_ACC_00U.bin "$work/driver.cab"
echo "48084d9fa53b9bb04358f3bb127b7495dc8f7bb0b3ca1437bd24ef2b6eabdf66  $work/FW_ACC_00U.bin" | sha256sum -c
ssh -i "$key" -o BatchMode=yes "root@$host" 'mkdir -p /media/developer/xbox-wireless; chmod 700 /media/developer/xbox-wireless'
scp -O -i "$key" "$work/FW_ACC_00U.bin" "root@$host:/media/developer/xbox-wireless/xow_dongle.bin"
ssh -i "$key" -o BatchMode=yes "root@$host" 'chmod 600 /media/developer/xbox-wireless/xow_dongle.bin'
