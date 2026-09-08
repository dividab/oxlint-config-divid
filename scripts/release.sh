#!/usr/bin/env bash
set -euo pipefail

bump="$1"
otp="${2:?Usage: pnpm ${1:-patch} <otp>}"

pnpm version "$bump"
pnpm publish --otp="$otp"
echo "Successfully released version $(node -p "require('./package.json').version")!"
