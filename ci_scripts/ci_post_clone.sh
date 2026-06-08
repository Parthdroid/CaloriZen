#!/bin/zsh

set -e

brew install node

npm install -g pnpm

cd ..

pnpm install || true

pod install
