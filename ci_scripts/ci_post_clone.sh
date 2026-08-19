#!/bin/zsh

set -euo pipefail

SCRIPT_DIR=${0:A:h}
REPOSITORY_ROOT=${CI_PRIMARY_REPOSITORY_PATH:-${SCRIPT_DIR:h}}
PNPM_VERSION=10.33.1

brew install node@24
export PATH="$(brew --prefix node@24)/bin:$PATH"

node --version
npm install --global "pnpm@${PNPM_VERSION}"
pnpm --version

cd "$REPOSITORY_ROOT"
pnpm install --frozen-lockfile
pod install --deployment
