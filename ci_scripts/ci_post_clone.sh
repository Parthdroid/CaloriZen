#!/bin/zsh

set -euo pipefail

SCRIPT_DIR=${0:A:h}
REPOSITORY_ROOT=${CI_PRIMARY_REPOSITORY_PATH:-${SCRIPT_DIR:h}}
PNPM_VERSION=10.33.1

brew install node@24
NODE_24_PREFIX=$(brew --prefix node@24)
export PATH="${NODE_24_PREFIX}/bin:$PATH"

NODE_24_BINARY=$(command -v node)
if [[ $("$NODE_24_BINARY" --version) != v24.* ]]; then
  echo "Expected Node 24 in Xcode Cloud" >&2
  exit 1
fi
"$NODE_24_BINARY" --version
npm install --global "pnpm@${PNPM_VERSION}"
pnpm --version

cd "$REPOSITORY_ROOT"
printf 'export NODE_BINARY="%s"\n' "$NODE_24_BINARY" > .xcode.env.local
pnpm install --frozen-lockfile
pod install --deployment
