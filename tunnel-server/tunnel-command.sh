#!/bin/sh

# Enable debug output
set -x

# Generate random subdomain (32 characters)
SUBDOMAIN=$(head /dev/urandom | tr -dc a-z0-9 | head -c 32)

# Extract the original command to get the local port
ORIGINAL_COMMAND="$SSH_ORIGINAL_COMMAND"
LOCAL_PORT=$(echo "$ORIGINAL_COMMAND" | grep -o 'localhost:[0-9]*' | cut -d':' -f2)

if [ -z "$LOCAL_PORT" ]; then
    LOCAL_PORT="8080"  # Default port if none specified
fi

# Use a lock directory to avoid race conditions
LOCK_DIR="/tmp/tunnel-locks"
mkdir -p "$LOCK_DIR"

for PORT in $(seq 10000 10099); do
    if mkdir "$LOCK_DIR/$PORT" 2>/dev/null; then
        # Create a cleanup function
        cleanup() {
            rm -rf "$LOCK_DIR/$PORT"
            exit 0
        }
        trap cleanup EXIT INT TERM

        echo "Forwarding HTTP traffic from https://$SUBDOMAIN.tunnel.raar.dev"
        echo "Press Ctrl+C to stop the tunnel"

        # Remove exec to prevent immediate script exit
        ssh -N -R "$PORT:localhost:$LOCAL_PORT" localhost &
        SSH_PID=$!

        # Wait for SSH process
        wait $SSH_PID

        # Clean up and exit if SSH process ends
        cleanup
    fi
done

echo "No available ports in range 10000-10099"
exit 1
