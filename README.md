# RaaR

An Open-Source, Local-First Swiss Army Knife for Crypto Development

RaaR is a desktop application built with Tauri, React, and TypeScript, designed to provide a suite of tools for crypto developers and blockchain enthusiasts.

## Features

- **RPC Client**: Interact with Ethereum nodes using JSON-RPC calls.
- **Transaction Tracer**: Analyze and trace Ethereum transactions.
- **Transaction Pool**: View and manage pending transactions.
- **Chain Extractor**: Extract data from the blockchain
- **Chain Analyzer**: Analyze and visualize blockchain data
- **Chain List**: View and manage information about different blockchain networks.
- **Devnet**: Set up and manage local development networks.
- **Wallet Generator**: Create and manage Ethereum wallets.
- **Unit Converter**: Convert between different Ethereum units.
- **Contract Interaction**: Interact with smart contracts on various networks.
- **4bytes Decoder**: Decode function signatures, calldata, and events.
- **Gas Tracker**: Monitor gas prices across multiple chains.
- **Contract Map**: Visualize contract relationships (experimental).
- **Hex Converter**: Convert between hex strings and numbers.
- **Key Converter**: Convert mnemonics or private keys to addresses.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [Rust](https://www.rust-lang.org/) (latest stable version)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/raardev/raar.git
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
