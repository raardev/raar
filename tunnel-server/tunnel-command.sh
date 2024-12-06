#!/bin/sh

# Generate random subdomain (16 characters)
SUBDOMAIN=$(head /dev/urandom | tr -dc a-z0-9 | head -c 16)

# Extract the original command to get the local port
ORIGINAL_COMMAND="$SSH_ORIGINAL_COMMAND"
LOCAL_PORT=$(echo "$ORIGINAL_COMMAND" | grep -o 'localhost:[0-9]*' | cut -d':' -f2)

if [ -z "$LOCAL_PORT" ]; then
    LOCAL_PORT="8080"  # Default port if none specified
fi

# Find available port in range 10000-10099
for PORT in $(seq 10000 10099); do
    if ! netstat -tln | grep -q ":$PORT "; then
        echo "Forwarding HTTP traffic from https://$SUBDOMAIN.tunnel.raar.dev"
        echo "Press Ctrl+C to stop the tunnel"

        # Execute the SSH tunnel command
        # Use -N for no shell, -R for remote port forwarding
        exec ssh -N -R "$PORT:localhost:$LOCAL_PORT" localhost &

        # Keep the connection alive
        while true; do
            sleep infinity
        done
        exit 0
    fi
done

echo "No available ports in range 10000-10099"
exit 1
