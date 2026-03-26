# Typeless AI

AI-Powered Voice Dictation Tool built with Electron, React, and TypeScript.

## Project Structure

```
typeless-ai/
├── main/           # Electron main process
│   ├── index.ts    # Main process entry
│   └── preload.ts  # Preload script
├── renderer/       # React renderer process
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── test/   # Test files
│   └── index.html
├── shared/         # Shared types and utilities
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run electron:dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron window
3. Enable hot module replacement

### Building

Build for production:

```bash
npm run electron:build
```

This creates platform-specific installers in the `release/` directory.

### Testing

Run tests:

```bash
npm run test              # Run tests
npm run test:ui           # Run tests with UI
npm run test:coverage     # Run tests with coverage report
```

### Code Quality

Lint and format code:

```bash
npm run lint             # Check code quality
npm run lint:fix         # Fix linting issues
npm run format           # Format code
npm run format:check     # Check formatting
```

## Tech Stack

- **Electron** ^28.0.0 - Desktop application framework
- **React** ^18.2.0 - UI library
- **TypeScript** ^5.3.0 - Type-safe JavaScript
- **Vite** ^5.0.0 - Build tool and dev server
- **Vitest** - Testing framework
- **ESLint + Prettier** - Code quality tools

## Features

- ✅ Electron + React + TypeScript setup
- ✅ Hot reload development mode
- ✅ Complete testing setup with ≥90% coverage
- ✅ ESLint + Prettier configuration
- ✅ Production build with electron-builder
- ✅ Type-safe IPC communication

## License

MIT
