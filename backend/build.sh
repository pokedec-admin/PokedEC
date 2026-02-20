#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Building Backend..."

cd backend
npm install
# If we had TypeScript, we would run tsc here:
# npm run build 

echo "Build finished successfully."
