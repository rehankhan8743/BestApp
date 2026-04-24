#!/bin/bash

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install

# Build client
echo "Building client..."
npm run build

echo "Build complete!"
