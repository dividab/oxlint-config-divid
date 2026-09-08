#!/usr/bin/env bash
set -euo pipefail

bump="$1"

if [ "$bump" != "publish-only" ]; then
  pnpm version "$bump"
fi

read -r -p "npm OTP: " otp < /dev/tty
pnpm publish --otp="$otp"
echo "Successfully released version $(node -p "require('./package.json').version")!"
