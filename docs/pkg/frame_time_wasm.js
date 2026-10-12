/* @ts-self-types="./frame_time_wasm.d.ts" */

/**
 * Search result returned to JS.
 */
export class JsSearchHit {
    static __wrap(ptr) {
        const obj = Object.create(JsSearchHit.prototype);
        obj.__wbg_ptr = ptr;
        JsSearchHitFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        JsSearchHitFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_jssearchhit_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get advance() {
        const ret = wasm.__wbg_get_jssearchhit_advance(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get atk() {
        const ret = wasm.__wbg_get_jssearchhit_atk(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get def() {
        const ret = wasm.__wbg_get_jssearchhit_def(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get hp() {
        const ret = wasm.__wbg_get_jssearchhit_hp(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    get nature() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_jssearchhit_nature(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get pid() {
        const ret = wasm.__wbg_get_jssearchhit_pid(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {boolean}
     */
    get shiny() {
        const ret = wasm.__wbg_get_jssearchhit_shiny(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get spa() {
        const ret = wasm.__wbg_get_jssearchhit_spa(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get spd() {
        const ret = wasm.__wbg_get_jssearchhit_spd(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get spe() {
        const ret = wasm.__wbg_get_jssearchhit_spe(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    get square_shiny() {
        const ret = wasm.__wbg_get_jssearchhit_square_shiny(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get state() {
        const ret = wasm.__wbg_get_jssearchhit_state(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set advance(arg0) {
        wasm.__wbg_set_jssearchhit_advance(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set atk(arg0) {
        wasm.__wbg_set_jssearchhit_atk(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set def(arg0) {
        wasm.__wbg_set_jssearchhit_def(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set hp(arg0) {
        wasm.__wbg_set_jssearchhit_hp(this.__wbg_ptr, arg0);
    }
    /**
     * @param {string} arg0
     */
    set nature(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_jssearchhit_nature(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {number} arg0
     */
    set pid(arg0) {
        wasm.__wbg_set_jssearchhit_pid(this.__wbg_ptr, arg0);
    }
    /**
     * @param {boolean} arg0
     */
    set shiny(arg0) {
        wasm.__wbg_set_jssearchhit_shiny(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set spa(arg0) {
        wasm.__wbg_set_jssearchhit_spa(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set spd(arg0) {
        wasm.__wbg_set_jssearchhit_spd(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set spe(arg0) {
        wasm.__wbg_set_jssearchhit_spe(this.__wbg_ptr, arg0);
    }
    /**
     * @param {boolean} arg0
     */
    set square_shiny(arg0) {
        wasm.__wbg_set_jssearchhit_square_shiny(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set state(arg0) {
        wasm.__wbg_set_jssearchhit_state(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) JsSearchHit.prototype[Symbol.dispose] = JsSearchHit.prototype.free;

/**
 * Find which advance generated a PID (Method 1, seed 0).
 * Returns -1 if not found within limit.
 * @param {number} pid
 * @param {number} limit
 * @returns {bigint}
 */
export function find_pid_advance(pid, limit) {
    const ret = wasm.find_pid_advance(pid, limit);
    return ret;
}

/**
 * Find shiny Pokemon for the given TID/SID.
 * Returns an array of search hits.
 * @param {number} tid
 * @param {number} sid
 * @param {number} min_advance
 * @param {number} max_advance
 * @returns {JsSearchHit[]}
 */
export function find_shinies(tid, sid, min_advance, max_advance) {
    const ret = wasm.find_shinies(tid, sid, min_advance, max_advance);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Find shiny Pokemon with specific natures.
 * natures is a comma-separated list like "Adamant,Jolly,Timid"
 * @param {number} tid
 * @param {number} sid
 * @param {string} natures
 * @param {number} min_advance
 * @param {number} max_advance
 * @returns {JsSearchHit[]}
 */
export function find_shinies_with_natures(tid, sid, natures, min_advance, max_advance) {
    const ptr0 = passStringToWasm0(natures, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.find_shinies_with_natures(tid, sid, ptr0, len0, min_advance, max_advance);
    var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]);
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * Calculate frames remaining from current state to target advance.
 * Returns an object with { current, target, remaining } or null if state not found.
 * @param {number} current_state
 * @param {number} target_advance
 * @returns {any}
 */
export function frames_to_target(current_state, target_advance) {
    const ret = wasm.frames_to_target(current_state, target_advance);
    return ret;
}

/**
 * Generate Pokemon data at a specific advance.
 * @param {number} advance
 * @param {number} tid
 * @param {number} sid
 * @returns {JsSearchHit}
 */
export function generate_at(advance, tid, sid) {
    const ret = wasm.generate_at(advance, tid, sid);
    return JsSearchHit.__wrap(ret);
}

/**
 * Initialize the Emerald advance index. Call this early to avoid lag on first lookup.
 */
export function init_index() {
    wasm.init_index();
}

/**
 * Look up the advance number for an RNG state (Emerald seed 0).
 * Returns -1 if not found.
 * @param {number} state
 * @returns {bigint}
 */
export function lookup_advance(state) {
    const ret = wasm.lookup_advance(state);
    return ret;
}

/**
 * Compute the LCRNG state after n advances from seed 0.
 * @param {number} advances
 * @returns {number}
 */
export function state_after(advances) {
    const ret = wasm.state_after(advances);
    return ret >>> 0;
}

/**
 * Advance a given state by one step.
 * @param {number} state
 * @returns {number}
 */
export function step(state) {
    const ret = wasm.step(state);
    return ret >>> 0;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_debug_string_4687d8d8c2017d52: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_jssearchhit_new: function(arg0) {
            const ret = JsSearchHit.__wrap(arg0);
            return ret;
        },
        __wbg_new_617a8cdb8bb1130e: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_set_145a351398b48c65: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbindgen_generic_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000002: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./frame_time_wasm_bg.js": import0,
    };
}

const JsSearchHitFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_jssearchhit_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('frame_time_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
