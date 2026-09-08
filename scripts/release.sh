#!/usr/bin/env bash
set -euo pipefail

bump="$1"

if [ "$bump" != "publish-only" ]; then
  pnpm version "$bump"
fi

set +e
publish_output=$(pnpm publish 2>&1)
publish_status=$?
set -e
echo "$publish_output"

if [ $publish_status -ne 0 ] && echo "$publish_output" | grep -qi "one-time password\|EOTP"; then
  read -r -p "npm OTP: " otp < /dev/tty
  pnpm publish --otp="$otp"
elif [ $publish_status -ne 0 ]; then
  exit "$publish_status"
fi

echo "Successfully released version $(node -p "require('./package.json').version")!"
