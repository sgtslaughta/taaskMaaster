#!/bin/sh
# entrypoint.sh

# Wait for Backend
until nc -z backend 8000; do
  echo "Waiting for Backend..."
  sleep 1
done

# Clean any existing build files
echo "Cleaning existing build files..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Start the application in development mode with proper host binding
echo "Starting Next.js development server..."
exec npm run dev -- --hostname 0.0.0.0 --port 3000
