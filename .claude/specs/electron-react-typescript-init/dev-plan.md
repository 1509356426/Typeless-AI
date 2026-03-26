# Development Plan: Electron + React + TypeScript Project Initialization

## Overview
Initialize a complete Electron + React + TypeScript project with Vite, full HMR support, and comprehensive testing infrastructure.

## Requirements Summary
- Electron main process (main/) and renderer process (renderer/) separation
- React 18 + TypeScript 5.x
- Vite as dev server and build tool
- Full HMR (Hot Module Replacement) for React
- Vitest + React Testing Library with ≥90% coverage
- Project must start via `npm run dev`

## Task Breakdown

### Task 1: Core Infrastructure Setup
**Type:** `default`
**Backend:** `claude`
**Dependencies:** None
**File Scope:**
- `package.json` - All dependencies and scripts
- `tsconfig.json` - Root TypeScript config
- `tsconfig.node.json` - Node-specific TypeScript config
- `vite.config.ts` - Vite configuration with HMR
- `vitest.config.ts` - Vitest configuration
- `.gitignore` - Git ignore rules
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration

**Deliverables:**
- Complete package.json with all required dependencies:
  - electron ^28.0.0
  - react ^18.2.0
  - react-dom ^18.2.0
  - typescript ^5.3.0
  - vite ^5.0.0
  - @vitejs/plugin-react ^4.2.0
  - vitest, @testing-library/react, jsdom
  - concurrently, cross-env (for dev scripts)
- Scripts: dev, build, test, lint
- TypeScript with strict mode and path aliases
- Vite config with React plugin and HMR
- Vitest config with jsdom environment

### Task 2: Electron Main Process
**Type:** `default`
**Backend:** `claude`
**Dependencies:** Task 1
**File Scope:**
- `main/index.ts` - Main process entry
- `main/preload.ts` - Preload script with contextBridge
- `main/test/index.test.ts` - Main process tests

**Deliverables:**
- Main window creation with proper config
- IPC handlers for basic communication
- HMR support: loadURL in dev, loadFile in production
- contextBridge for secure IPC exposure
- Tests for window lifecycle and IPC handlers
- Coverage ≥90%

### Task 3: React Renderer Process
**Type:** `ui`
**Backend:** `gemini`
**Dependencies:** Task 1
**File Scope:**
- `renderer/index.html` - HTML entry
- `renderer/src/main.tsx` - React entry
- `renderer/src/App.tsx` - Root component
- `renderer/src/App.css` - Component styles
- `renderer/src/index.css` - Global styles
- `renderer/src/test/setup.ts` - Test setup
- `renderer/src/test/App.test.tsx` - Component tests

**Deliverables:**
- Clean React 18 setup with TypeScript
- Proper root component with error boundary
- Basic styling with modern CSS
- React Testing Library setup
- Comprehensive component tests
- Coverage ≥90%

### Task 4: Shared Types and Utilities
**Type:** `default`
**Backend:** `claude`
**Dependencies:** Task 1
**File Scope:**
- `shared/types.ts` - Shared TypeScript types
- `shared/index.ts` - Shared utilities
- `shared/test/types.test.ts` - Type utility tests

**Deliverables:**
- IPC message type definitions
- Common utility functions
- Type-safe IPC interfaces
- Tests for type utilities
- Coverage ≥90%

### Task 5: Documentation and Final Integration
**Type:** `quick-fix`
**Backend:** `claude`
**Dependencies:** Tasks 1, 2, 3, 4
**File Scope:**
- `README.md` - Project documentation
- `package.json` - Verify all scripts work

**Deliverables:**
- Complete README with:
  - Project description
  - Prerequisites
  - Installation steps
  - Development workflow (npm run dev)
  - Build instructions
  - Testing instructions
  - Project structure overview
- Verify `npm run dev` works end-to-end
- Verify `npm test` achieves ≥90% coverage

## Test Commands
- Unit tests: `npm test`
- Coverage: `npm run test:coverage`
- Linting: `npm run lint`

## Backend Routing Rules
- Task type `default` → `claude` (codex unavailable, using fallback)
- Task type `ui` → `gemini`
- Task type `quick-fix` → `claude`

## UI Work Determination
**needs_ui:** true
**evidence:**
- React components (.tsx files)
- CSS styling (.css files)
- User-facing UI requirements

## Definition of Done
- [ ] All tasks completed with ≥90% coverage
- [ ] `npm run dev` starts project successfully
- [ ] Electron window displays React app
- [ ] HMR works for React components
- [ ] TypeScript compilation with no errors
- [ ] All tests pass
- [ ] README.md complete
