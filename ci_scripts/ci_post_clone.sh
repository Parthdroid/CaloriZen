#!/bin/zsh

set -e

brew install node

corepack enable

cd ..

pnpm install

pod install
