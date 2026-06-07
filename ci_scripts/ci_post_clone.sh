#!/bin/zsh

set -e

echo "PATH=$PATH"

which node || true
which npm || true

echo "Skipping pod install in post-clone"

