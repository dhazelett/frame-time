/* tslint:disable */
/* eslint-disable */

/**
 * Search result returned to JS.
 */
export class JsSearchHit {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    advance: number;
    atk: number;
    def: number;
    hp: number;
    nature: string;
    pid: number;
    shiny: boolean;
    spa: number;
    spd: number;
    spe: number;
    square_shiny: boolean;
    state: number;
}

/**
 * Find which advance generated a PID (Method 1, seed 0).
 * Returns -1 if not found within limit.
 */
export function find_pid_advance(pid: number, limit: number): bigint;

/**
 * Find shiny Pokemon for the given TID/SID.
 * Returns an array of search hits.
 */
export function find_shinies(tid: number, sid: number, min_advance: number, max_advance: number): JsSearchHit[];

/**
 * Find shiny Pokemon with specific natures.
 * natures is a comma-separated list like "Adamant,Jolly,Timid"
 */
export function find_shinies_with_natures(tid: number, sid: number, natures: string, min_advance: number, max_advance: number): JsSearchHit[];

/**
 * Calculate frames remaining from current state to target advance.
 * Returns an object with { current, target, remaining } or null if state not found.
 */
export function frames_to_target(current_state: number, target_advance: number): any;

/**
 * Generate Pokemon data at a specific advance.
 */
export function generate_at(advance: number, tid: number, sid: number): JsSearchHit;

/**
 * Initialize the Emerald advance index. Call this early to avoid lag on first lookup.
 */
export function init_index(): void;

/**
 * Look up the advance number for an RNG state (Emerald seed 0).
 * Returns -1 if not found.
 */
export function lookup_advance(state: number): bigint;

/**
 * Compute the LCRNG state after n advances from seed 0.
 */
export function state_after(advances: number): number;

/**
 * Advance a given state by one step.
 */
export function step(state: number): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_get_jssearchhit_advance: (a: number) => number;
    readonly __wbg_get_jssearchhit_atk: (a: number) => number;
    readonly __wbg_get_jssearchhit_def: (a: number) => number;
    readonly __wbg_get_jssearchhit_hp: (a: number) => number;
    readonly __wbg_get_jssearchhit_nature: (a: number) => [number, number];
    readonly __wbg_get_jssearchhit_pid: (a: number) => number;
    readonly __wbg_get_jssearchhit_shiny: (a: number) => number;
    readonly __wbg_get_jssearchhit_spa: (a: number) => number;
    readonly __wbg_get_jssearchhit_spd: (a: number) => number;
    readonly __wbg_get_jssearchhit_spe: (a: number) => number;
    readonly __wbg_get_jssearchhit_square_shiny: (a: number) => number;
    readonly __wbg_get_jssearchhit_state: (a: number) => number;
    readonly __wbg_jssearchhit_free: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_advance: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_atk: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_def: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_hp: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_nature: (a: number, b: number, c: number) => void;
    readonly __wbg_set_jssearchhit_pid: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_shiny: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_spa: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_spd: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_spe: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_square_shiny: (a: number, b: number) => void;
    readonly __wbg_set_jssearchhit_state: (a: number, b: number) => void;
    readonly find_pid_advance: (a: number, b: number) => bigint;
    readonly find_shinies: (a: number, b: number, c: number, d: number) => [number, number];
    readonly find_shinies_with_natures: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly frames_to_target: (a: number, b: number) => any;
    readonly generate_at: (a: number, b: number, c: number) => number;
    readonly init_index: () => void;
    readonly lookup_advance: (a: number) => bigint;
    readonly state_after: (a: number) => number;
    readonly step: (a: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_drop_slice: (a: number, b: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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
