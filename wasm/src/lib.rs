//! WASM bindings for the Gen 3 Pokemon RNG core.

#![allow(clippy::clone_on_copy)]

use std::sync::OnceLock;

use wasm_bindgen::prelude::*;

use core::{AdvanceIndex, Lcrng, Nature, SearchCriteria};

/// Global advance index for Emerald (seed 0).
/// Built lazily on first use.
static EMERALD_INDEX: OnceLock<AdvanceIndex> = OnceLock::new();

const DEFAULT_MAX_ADVANCE: u32 = 1_000_000;

fn get_emerald_index() -> &'static AdvanceIndex {
    EMERALD_INDEX.get_or_init(|| AdvanceIndex::emerald(DEFAULT_MAX_ADVANCE))
}

// ============================================================================
// LCRNG functions
// ============================================================================

/// Compute the LCRNG state after n advances from seed 0.
#[wasm_bindgen]
pub fn state_after(advances: u32) -> u32 {
    Lcrng::state_after(0, advances)
}

/// Advance a given state by one step.
#[wasm_bindgen]
pub fn step(state: u32) -> u32 {
    let mut rng = Lcrng::new(state);
    rng.step()
}

// ============================================================================
// Advance index functions
// ============================================================================

/// Initialize the Emerald advance index. Call this early to avoid lag on first lookup.
#[wasm_bindgen]
pub fn init_index() {
    let _ = get_emerald_index();
}

/// Look up the advance number for an RNG state (Emerald seed 0).
/// Returns -1 if not found.
#[wasm_bindgen]
pub fn lookup_advance(state: u32) -> i64 {
    match get_emerald_index().lookup(state) {
        Some(adv) => adv as i64,
        None => -1,
    }
}

/// Calculate frames remaining from current state to target advance.
/// Returns an object with { current, target, remaining } or null if state not found.
#[wasm_bindgen]
pub fn frames_to_target(current_state: u32, target_advance: u32) -> JsValue {
    match get_emerald_index().lookup(current_state) {
        Some(current) => {
            let remaining = target_advance as i64 - current as i64;
            let obj = js_sys::Object::new();
            js_sys::Reflect::set(&obj, &"current".into(), &JsValue::from(current)).unwrap();
            js_sys::Reflect::set(&obj, &"target".into(), &JsValue::from(target_advance)).unwrap();
            js_sys::Reflect::set(&obj, &"remaining".into(), &JsValue::from(remaining)).unwrap();
            js_sys::Reflect::set(
                &obj,
                &"targetState".into(),
                &JsValue::from(state_after(target_advance)),
            )
            .unwrap();
            obj.into()
        }
        None => JsValue::NULL,
    }
}

// ============================================================================
// Search functions
// ============================================================================

/// Search result returned to JS.
#[wasm_bindgen(getter_with_clone)]
pub struct JsSearchHit {
    pub advance: u32,
    pub state: u32,
    pub pid: u32,
    pub nature: String,
    pub shiny: bool,
    pub square_shiny: bool,
    pub hp: u8,
    pub atk: u8,
    pub def: u8,
    pub spa: u8,
    pub spd: u8,
    pub spe: u8,
}

/// Find shiny Pokemon for the given TID/SID.
/// Returns an array of search hits.
#[wasm_bindgen]
pub fn find_shinies(tid: u16, sid: u16, min_advance: u32, max_advance: u32) -> Vec<JsSearchHit> {
    let hits = core::find_shinies(0, tid, sid, min_advance, max_advance);

    hits.into_iter()
        .map(|h| JsSearchHit {
            advance: h.advance,
            state: h.state,
            pid: h.pokemon.pid,
            nature: h.pokemon.nature.name().to_string(),
            shiny: h.pokemon.shiny,
            square_shiny: h.pokemon.square_shiny,
            hp: h.pokemon.ivs.hp,
            atk: h.pokemon.ivs.atk,
            def: h.pokemon.ivs.def,
            spa: h.pokemon.ivs.spa,
            spd: h.pokemon.ivs.spd,
            spe: h.pokemon.ivs.spe,
        })
        .collect()
}

/// Find shiny Pokemon with specific natures.
/// natures is a comma-separated list like "Adamant,Jolly,Timid"
#[wasm_bindgen]
pub fn find_shinies_with_natures(
    tid: u16,
    sid: u16,
    natures: &str,
    min_advance: u32,
    max_advance: u32,
) -> Vec<JsSearchHit> {
    let nature_list: Vec<Nature> = natures
        .split(',')
        .filter_map(|s| parse_nature(s.trim()))
        .collect();

    let criteria = SearchCriteria::shiny_with_natures(nature_list);
    let hits = core::find_targets(0, tid, sid, &criteria, min_advance, max_advance);

    hits.into_iter()
        .map(|h| JsSearchHit {
            advance: h.advance,
            state: h.state,
            pid: h.pokemon.pid,
            nature: h.pokemon.nature.name().to_string(),
            shiny: h.pokemon.shiny,
            square_shiny: h.pokemon.square_shiny,
            hp: h.pokemon.ivs.hp,
            atk: h.pokemon.ivs.atk,
            def: h.pokemon.ivs.def,
            spa: h.pokemon.ivs.spa,
            spd: h.pokemon.ivs.spd,
            spe: h.pokemon.ivs.spe,
        })
        .collect()
}

/// Parse a nature name to Nature enum.
fn parse_nature(name: &str) -> Option<Nature> {
    match name.to_lowercase().as_str() {
        "hardy" => Some(Nature::Hardy),
        "lonely" => Some(Nature::Lonely),
        "brave" => Some(Nature::Brave),
        "adamant" => Some(Nature::Adamant),
        "naughty" => Some(Nature::Naughty),
        "bold" => Some(Nature::Bold),
        "docile" => Some(Nature::Docile),
        "relaxed" => Some(Nature::Relaxed),
        "impish" => Some(Nature::Impish),
        "lax" => Some(Nature::Lax),
        "timid" => Some(Nature::Timid),
        "hasty" => Some(Nature::Hasty),
        "serious" => Some(Nature::Serious),
        "jolly" => Some(Nature::Jolly),
        "naive" => Some(Nature::Naive),
        "modest" => Some(Nature::Modest),
        "mild" => Some(Nature::Mild),
        "quiet" => Some(Nature::Quiet),
        "bashful" => Some(Nature::Bashful),
        "rash" => Some(Nature::Rash),
        "calm" => Some(Nature::Calm),
        "gentle" => Some(Nature::Gentle),
        "sassy" => Some(Nature::Sassy),
        "careful" => Some(Nature::Careful),
        "quirky" => Some(Nature::Quirky),
        _ => None,
    }
}

// ============================================================================
// PID lookup
// ============================================================================

/// Find which advance generated a PID (Method 1, seed 0).
/// Returns -1 if not found within limit.
#[wasm_bindgen]
pub fn find_pid_advance(pid: u32, limit: u32) -> i64 {
    match core::find_pid_advance(0, pid, limit) {
        Some(adv) => adv as i64,
        None => -1,
    }
}

/// Generate Pokemon data at a specific advance.
#[wasm_bindgen]
pub fn generate_at(advance: u32, tid: u16, sid: u16) -> JsSearchHit {
    let pokemon = core::generate_method1(0, advance, tid, sid);
    let state = Lcrng::state_after(0, advance);

    JsSearchHit {
        advance,
        state,
        pid: pokemon.pid,
        nature: pokemon.nature.name().to_string(),
        shiny: pokemon.shiny,
        square_shiny: pokemon.square_shiny,
        hp: pokemon.ivs.hp,
        atk: pokemon.ivs.atk,
        def: pokemon.ivs.def,
        spa: pokemon.ivs.spa,
        spd: pokemon.ivs.spd,
        spe: pokemon.ivs.spe,
    }
}
