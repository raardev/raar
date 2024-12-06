#!/bin/sh

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

        # Execute the SSH tunnel command
        # Use -N for no shell, -R for remote port forwarding
        exec ssh -N -R "$PORT:localhost:$LOCAL_PORT" localhost &

        # Use a more reliable keep-alive mechanism
        while kill -0 $! 2>/dev/null; do
            sleep 5
        done
        exit 0
    fi
done

echo "No available ports in range 10000-10099"
exit 1
