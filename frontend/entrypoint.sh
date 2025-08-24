#!/bin/sh
# entrypoint.sh

# Wait for Backend
until nc -z backend 8000; do
  echo "Waiting for Backend..."
  sleep 1
done

# Start the application
exec npm run dev
