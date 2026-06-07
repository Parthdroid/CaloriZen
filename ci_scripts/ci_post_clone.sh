#!/bin/sh

set -e

echo "Installing pnpm..."
npm install -g pnpm

echo "Installing JavaScript dependencies..."
pnpm install

echo "Installing CocoaPods dependencies..."
pod install

echo "Finished setup."

