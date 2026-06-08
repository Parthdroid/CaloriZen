#!/bin/zsh

set -e

brew install node@24

export PATH="/usr/local/opt/node@24/bin:$PATH"

node --version

npm install -g pnpm

cd ..

pnpm install || true

pod install
