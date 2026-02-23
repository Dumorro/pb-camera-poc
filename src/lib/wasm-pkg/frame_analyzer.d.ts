/* tslint:disable */
/* eslint-disable */

/**
 * Result of frame quality analysis.
 */
export class FrameAnalysis {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Weighted luminance, 0.0 (black) – 1.0 (white).
     */
    brightness: number;
    /**
     * Laplacian variance: higher = sharper.
     */
    sharpness: number;
}

/**
 * Analyse an RGBA frame from a canvas ImageData.
 *
 * # Arguments
 * * `pixels` – raw RGBA bytes (length = width * height * 4)
 * * `width`  – frame width in pixels
 * * `height` – frame height in pixels
 */
export function analyze_frame(pixels: Uint8Array, width: number, height: number): FrameAnalysis;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_frameanalysis_free: (a: number, b: number) => void;
    readonly __wbg_get_frameanalysis_brightness: (a: number) => number;
    readonly __wbg_get_frameanalysis_sharpness: (a: number) => number;
    readonly __wbg_set_frameanalysis_brightness: (a: number, b: number) => void;
    readonly __wbg_set_frameanalysis_sharpness: (a: number, b: number) => void;
    readonly analyze_frame: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
