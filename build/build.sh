#!/bin/bash
set -e

echo "=== Starting Build ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Navigate to where package.json actually is
PROJECT_ROOT="/opt/render/project"
cd $PROJECT_ROOT

echo "After cd to project root:"
ls -la

if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found at $PROJECT_ROOT/package.json"
    echo "Searching for package.json..."
    find /opt/render -name "package.json" 2>/dev/null
    exit 1
fi

echo "Found package.json, installing dependencies..."
npm install

echo "Building React app..."
npm run build

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "=== Build Complete ==="