# RaaR

![image](https://private-user-images.githubusercontent.com/7393152/363385705-ec95104e-23dc-4ee9-a144-799eb8c6a49d.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MjUwNzM4NDksIm5iZiI6MTcyNTA3MzU0OSwicGF0aCI6Ii83MzkzMTUyLzM2MzM4NTcwNS1lYzk1MTA0ZS0yM2RjLTRlZTktYTE0NC03OTllYjhjNmE0OWQucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MDgzMSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDA4MzFUMDMwNTQ5WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9YzZhNWQ5YmQzMzVlODFlMTczM2U3ZDY0YzQyZGFkNjhlNjVmNTQ0MGQ0NzMyYTVmMzVlOWU0MThiOWJlMTVmZCZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmYWN0b3JfaWQ9MCZrZXlfaWQ9MCZyZXBvX2lkPTAifQ.6w7ovf72CcoAtY6nFfOEZB3tyANc5kAz0NivZS5tYTw)

An Open-Source, Local-First Swiss Army Knife for Crypto Development

RaaR is a desktop application built with Tauri, React, and TypeScript, designed to provide a suite of tools for crypto developers and blockchain enthusiasts.

## Features

- **RPC Client**: Interact with Ethereum nodes using JSON-RPC calls.
- **Transaction Tracer**: Analyze and trace Ethereum transactions.
- **Chain List**: View and manage information about different blockchain networks.
- **Devnet**: Set up and manage local development networks.
- **Wallet Generator**: Create and manage Ethereum wallets.
- **Unit Converter**: Convert between different Ethereum units.
- **Contract Interaction**: Interact with smart contracts on various networks.
- **4bytes Decoder**: Decode function signatures, calldata, and events.
- **Gas Tracker**: Monitor gas prices across multiple chains.
- **Contract Map**: Visualize contract relationships (experimental).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [Rust](https://www.rust-lang.org/) (latest stable version)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/raar.git
   cd raar
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Run the development server:
   ```
   bun run tauri dev
   ```

### Building for Production

To create a production build:

```
bun run tauri build
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
