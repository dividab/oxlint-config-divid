#!/usr/bin/env bash
# Bumps and publishes the package, re-prompting for OTP on failure instead of aborting.
set -euo pipefail

bump="$1"

if ! npm whoami >/dev/null 2>&1; then
  echo "Not logged in to npm — running npm login (press Enter to open the login page in your browser, see README for WSL browser setup)."
  npm login
fi

if [ "$bump" != "publish-only" ]; then
  pnpm version "$bump"
fi

# `pnpm publish` (pnpm >=11) uses a native publish implementation that spuriously
# 404s on this registry (see pnpm/pnpm#10926, pnpm/pnpm#11098). Pack with pnpm,
# publish the tarball with the npm CLI instead.
pack_output=$(pnpm pack --json)
tarball=$(echo "$pack_output" | grep -o '"filename": *"[^"]*"' | head -1 | sed -E 's/.*"filename": *"([^"]*)".*/\1/')

while true; do
  read -rp "npm OTP (empty to abort): " otp
  if [ -z "$otp" ]; then
    echo "Aborted."
    rm -f "$tarball"
    exit 1
  fi

  if npm publish "$tarball" --otp="$otp"; then
    break
  fi

  echo "Publish failed. If that was a wrong or expired OTP, enter a fresh one to retry."
done

rm -f "$tarball"

echo "Successfully released version $(node -p "require('./package.json').version")!"
