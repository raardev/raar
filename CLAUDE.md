# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RaaR is a desktop application built with Tauri, React, and TypeScript that provides a comprehensive suite of tools for crypto developers and blockchain enthusiasts. It combines a React frontend with a Rust backend, offering both local-first functionality and blockchain interaction capabilities.

## Development Commands

### Core Development
- `bun install` - Install dependencies
- `bun run dev` - Start Vite development server (frontend only)
- `bun run tauri dev` - Start full Tauri development environment (recommended)
- `bun run build` - Build frontend for production
- `bun run tauri build` - Build complete Tauri application for production

### Code Quality
- Code formatting and linting is handled by Biome (configured in `biome.json`)
- TypeScript strict mode is enabled with additional linting rules
- No specific test commands are configured in package.json

## Architecture

### Frontend Structure
- **Framework**: React 18 + TypeScript + Vite
- **State Management**: Zustand with persist middleware for tool-specific stores
- **UI Library**: Radix UI components with custom shadcn/ui implementations
- **Styling**: Tailwind CSS with custom design system
- **Data Fetching**: TanStack Query for async state management
- **Blockchain Integration**: Viem + Wagmi + ConnectKit for Ethereum interactions

### Backend Structure (Rust/Tauri)
- **Framework**: Tauri v1 with extensive API permissions
- **Blockchain Libraries**: Alloy for Ethereum interactions, Foundry Cast for CLI operations
- **Data Processing**: Cryo for blockchain data extraction, DuckDB + Polars for analysis
- **Local Development**: Anvil integration for local blockchain networks

### Key Directories
- `src/` - React frontend application
- `src/components/` - React components organized by functionality
- `src/stores/` - Zustand state management stores
- `src/config/` - Configuration files (chains, RPC defaults, etc.)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions and formatters
- `src-tauri/` - Rust backend application
- `src-tauri/src/` - Rust source code with blockchain and system integrations

### Component Architecture
The app uses a sidebar-based layout with categorized tools:
- **Core Tools**: RPC Client, Cast, Devnet
- **Transaction Tools**: Transaction Tracer, Transaction Pool, Gas Tracker  
- **Chain Tools**: Chain Extractor, Chain Analyzer, Chain List
- **Contract Tools**: Contract Interaction, Contract Map, 4bytes Decoder
- **Utilities**: Wallet Generator, Unit Converter, Hex Converter, Key Converter

Each tool is implemented as a self-contained React component with its own Zustand store for state management.

### State Management Pattern
- Each major feature has its own Zustand store (e.g., `rpcToolStore.ts`, `chainAnalyzerStore.ts`)
- Stores use Zustand's persist middleware to maintain state across sessions
- Global application state is minimal - most state is feature-specific

### Blockchain Integration
- Multi-chain support with comprehensive chain configurations in `src/config/chains.ts`
- Viem for type-safe Ethereum interactions
- Wagmi for React hooks and wallet connectivity
- ConnectKit for wallet connection UI
- Custom RPC client implementation for direct JSON-RPC calls

### Rust Backend Capabilities
- File system operations (read/write with scoped access)
- Shell command execution for Foundry Cast operations  
- HTTP requests for blockchain API calls
- Local Anvil devnet management
- Blockchain data extraction and analysis via Cryo
- DuckDB database operations for data persistence

## Development Notes

### Path Aliases
- `@/` maps to `./src/` for clean imports

### Package Manager
- Uses Bun as the primary package manager (see `bun.lockb`)

### Tauri Configuration
- Window size: 1200x800 pixels
- Extensive API allowlist including shell, dialog, fs, clipboard, and HTTP
- CSP configured for external API calls
- File system scope limited to Documents and Downloads folders

### Code Style
- Biome configuration enforces single quotes, 2-space indentation, 80 character line width
- Semicolons only as needed
- Import organization enabled
- TypeScript strict mode with additional safety checks