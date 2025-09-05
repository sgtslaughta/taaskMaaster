#!/bin/sh
# Production-focused entrypoint script for Docker containers

# Set environment variables for better compatibility
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Ensure proper permissions for build directories
# Create .next directory if it doesn't exist
mkdir -p .next

# Fix ownership and permissions for .next directory
# This handles cases where the directory is mounted from host
if [ -w .next ]; then
    chmod 755 .next
else
    # If we can't write, try to fix ownership (may require root)
    echo "Warning: Cannot modify .next directory permissions. This may cause issues in development mode."
fi

# Check if we should run in development mode
if [ "$NODE_ENV" = "development" ]; then
    echo "Starting Next.js in development mode..."
    # Start Next.js dev server
    exec npx next dev --turbopack --hostname 0.0.0.0 --port 3000
else
    echo "Starting Next.js in production mode..."
    
    # Check if build already exists, if not build it
    if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
        echo "Building Next.js application..."
        npm run build
    else
        echo "Using existing build..."
    fi
    
    # Start the production server
    echo "Starting production server..."
    exec npm run start:next
fi
