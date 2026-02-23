# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Proof-of-concept validating two critical technical blockers for the P&B MVP:

1. **Live camera capture** via PWA (`getUserMedia`, rear/1x camera, photo + video)
2. **WebAssembly in the browser** for real-time frame quality analysis (brightness + sharpness)

This PoC is intentionally minimal — no auth, no backend, no production hardening. There is no linting or test suite.

## Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 5 + TypeScript (strict mode) |
| UI | React 18 (no router, single page) |
| PWA | vite-plugin-pwa + Workbox |
| WASM | Rust (`frame-analyzer` crate) + wasm-pack 0.14 |
| Camera | `getUserMedia` + `MediaRecorder` + Canvas API |

## Commands

```bash
# Start dev server (also exposed on LAN — host: true is set in vite.config.ts)
npm run dev

# Rebuild Rust WASM module (run after editing wasm/src/lib.rs)
# The script already sources $HOME/.cargo/env internally
npm run build:wasm

# Production build
npm run build

# Serve production build locally
npm run preview
```

## Architecture & Data Flow

`App.tsx` owns top-level state. It wires together two hooks and passes refs/callbacks down:

```
App
 ├─ useCamera()          → videoRef, stream, status, startCamera, stopCamera
 ├─ useFrameAnalysis()   → metrics, wasmReady, startAnalysis, stopAnalysis
 │     └─ creates a detached <canvas> (not in DOM) for pixel reads
 ├─ CameraPreview        → renders <video ref={videoRef}> + QualityOverlay
 ├─ PhotoCapture         → captures frame from videoRef to its own hidden canvas; calls analyze_frame()
 └─ VideoCapture         → wraps useMediaRecorder(); records stream to .webm blob
```

Key wiring: `CameraPreview` fires `onVideoReady(videoEl)` when the `playing` event fires, which triggers `startAnalysis(videoEl)` in `useFrameAnalysis`.

## WASM Module (`wasm/src/lib.rs`)

Exports a single function:

```rust
pub fn analyze_frame(pixels: &[u8], width: u32, height: u32) -> FrameAnalysis
```

- **`brightness`** (f32, 0–1): weighted luminance `0.299R + 0.587G + 0.114B`
- **`sharpness`** (f32): Laplacian variance — higher = sharper

Compiled with: `wasm-pack build --target web --out-dir ../src/lib/wasm-pkg`

Output: `frame_analyzer.js` (glue) + `frame_analyzer_bg.wasm` (13 KB).

### Key gotchas

- **Uint8Array vs Uint8ClampedArray**: wasm-bindgen expects `Uint8Array`; canvas `ImageData.data` is `Uint8ClampedArray`. They share the same binary layout, so `src/lib/wasm.ts` reinterprets via the underlying `ArrayBuffer`.
- **Memory management**: always call `result.free()` after reading wasm-bindgen output to release heap memory.
- **Vite WASM support**: `vite.config.ts` must include `assetsInclude: ['**/*.wasm']` for Vite to bundle the `.wasm` file correctly.

## Frame Analysis Loop (`useFrameAnalysis.ts`)

- Uses `requestAnimationFrame` loop; analyses every **10th frame** (~3×/sec at 30fps)
- Creates a detached `document.createElement('canvas')` at 320×240 for `getImageData` — not attached to the DOM
- WASM is initialized on mount via `initWasm()`; `wasmReady` state reflects load completion

## Quality Thresholds (`QualityOverlay.tsx`)

| Condition | Threshold | Message |
|-----------|-----------|---------|
| Too dark | `brightness < 0.15` | 🌑 Ambiente muito escuro |
| Blurry | `sharpness < 50` | 📷 Câmera tremendo – firme mais |
| Both OK | — | ✅ Boa qualidade |

## Camera Constraints (`useCamera.ts`)

Tried in order:
1. `facingMode: { exact: 'environment' }` — rear camera (1x on mobile)
2. `facingMode: 'user'` — front camera fallback
3. `video: true` — any camera

## Prerequisites

- **Node.js 20+**
- **Rust toolchain**: installed at `~/.cargo/` via rustup
  - `wasm-pack` 0.14.0 installed globally
  - Target `wasm32-unknown-unknown` already added
- Browser with WebAssembly + `getUserMedia` support (Chrome / Firefox / Safari 14+)
- HTTPS or `localhost` required for `getUserMedia` on mobile (for local dev, `host: true` in vite.config.ts already exposes on LAN over HTTP, which works on some browsers with `localhost`; for strict mobile HTTPS, set `server.https` and provide certs)

## Testing Checklist

- [ ] `npm run build:wasm` completes without errors
- [ ] `npm run dev` opens in browser, camera permission prompt appears
- [ ] QualityOverlay updates ~3×/sec with brightness + sharpness values
- [ ] Photo capture: thumbnail appears with WASM metrics
- [ ] Video record/stop: `.webm` download link appears
- [ ] Mobile (LAN): rear camera activates by default, PWA installable
