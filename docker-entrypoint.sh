#!/bin/sh
set -e

# Ensure data directory exists and is owned by nextjs user
mkdir -p /app/data
chown -R nextjs:nodejs /app/data

# Execute the main container process as the nextjs user
exec su-exec nextjs "$@"
