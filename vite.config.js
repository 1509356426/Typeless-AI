"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = __importDefault(require("path"));
// https://vitejs.dev/config/
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    root: 'renderer',
    build: {
        outDir: '../dist/renderer',
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
    },
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './renderer/src'),
            '@shared': path_1.default.resolve(__dirname, './shared'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './renderer/src/test/setup',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.test.{ts,tsx}',
                '**/*.config.{ts,js}',
                'renderer/src/test/setup.ts',
            ],
            all: true,
        },
    },
});
