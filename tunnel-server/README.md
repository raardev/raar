# RaaR SSH Tunnel Server

A lightweight SSH tunnel server that provides temporary public URLs for local ports, similar to ngrok or serveo.net.

## Features

- Automatic subdomain generation
- Dynamic port allocation (10000-65535)
- No authentication required
- Secure by default (only allows port forwarding)
- Docker-based deployment

## Quick Start

1. Make sure you have Docker and Docker Compose installed

2. Deploy the server:
```bash
docker-compose up -d
```

That's it! The server will be running on port 2222.

## Usage

Simply run:
```bash
ssh -R 80:localhost:8080 tunnel.raar.dev -p 2222
```

You'll get output like:
```
Forwarding HTTP traffic from https://abc123def456.tunnel.raar.dev
Press Ctrl+C to stop the tunnel
```

The server will:
1. Generate a random subdomain
2. Assign a random port
3. Set up the tunnel automatically

## Domain Configuration

Add these DNS records:
```bash
# Main domain
tunnel.raar.dev.         A     <your-server-ip>

# Wildcard for subdomains
*.tunnel.raar.dev.       A     <your-server-ip>
```

## Security

The server is configured for maximum security:
- Only allows port forwarding
- No shell access
- No authentication required
- All other SSH features are disabled

## System Requirements

- Docker
- Docker Compose
- Available ports: 2222 and 10000-65535
- Domain with DNS control
