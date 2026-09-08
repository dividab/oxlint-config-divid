#!/usr/bin/env bash
set -euo pipefail

bump="$1"

if [ "$bump" != "publish-only" ]; then
  pnpm version "$bump"
fi

# `pnpm publish` (pnpm >=11) uses a native publish implementation that spuriously
# 404s on this registry (see pnpm/pnpm#10926, pnpm/pnpm#11098). Pack with pnpm,
# publish the tarball with the npm CLI instead, which handles OTP prompts itself.
pack_output=$(pnpm pack --json)
tarball=$(echo "$pack_output" | grep -o '"filename": *"[^"]*"' | head -1 | sed -E 's/.*"filename": *"([^"]*)".*/\1/')
npm publish "$tarball"
rm -f "$tarball"

echo "Successfully released version $(node -p "require('./package.json').version")!"
