# RaaR SSH Tunnel Server

A lightweight SSH tunnel server that provides temporary public URLs for local ports, similar to ngrok.

## Features

- Supports up to 100 concurrent tunnel connections
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

That's it! The server will be running on:
- SSH port: 2222
- Tunnel ports: 10000-65535

## Usage Example

To create a tunnel from your local port 8080:
```bash
ssh -R 80:localhost:8080 tunnel.raar.dev -p 2222
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
