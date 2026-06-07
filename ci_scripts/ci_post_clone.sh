#!/bin/zsh

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo "Node version:"
which node || true
node --version || true

echo "NPM version:"
which npm || true
npm --version || true

echo "Installing CocoaPods dependencies..."
pod install

echo "Finished setup."
