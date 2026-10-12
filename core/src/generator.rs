//! Pokemon generation methods for Gen 3.
//!
//! Method 1 (Static encounters like Rayquaza):
//! - Call 1: PID low 16 bits
//! - Call 2: PID high 16 bits
//! - Call 3: IV word 1 (HP, Atk, Def)
//! - Call 4: IV word 2 (Spe, SpA, SpD)

use crate::lcrng::Lcrng;
use crate::pokemon::{Ivs, Nature, Pokemon};

/// Generate a Pokemon using Method 1 (static encounters).
///
/// The `advance` parameter is the advance number at which generation starts.
/// This consumes 4 RNG calls starting from that advance.
#[must_use]
pub fn generate_method1(seed: u32, advance: u32, tid: u16, sid: u16) -> Pokemon {
    let mut rng = Lcrng::new(seed);
    rng.advance(advance);

    // Call 1: PID low
    let pid_low = rng.step() >> 16;
    // Call 2: PID high
    let pid_high = rng.step() >> 16;
    // Call 3: IV word 1
    let iv1 = (rng.step() >> 16) as u16;
    // Call 4: IV word 2
    let iv2 = (rng.step() >> 16) as u16;

    let pid = (pid_high << 16) | pid_low;
    let nature = Nature::from_pid(pid);
    let ivs = Ivs::from_iv_words(iv1, iv2);
    let ability_slot = (pid & 1) as u8;
    let shiny = Pokemon::is_shiny(pid, tid, sid);
    let square_shiny = Pokemon::is_square_shiny(pid, tid, sid);

    Pokemon {
        pid,
        nature,
        ivs,
        ability_slot,
        shiny,
        square_shiny,
    }
}

/// Find the advance that generated a given PID using Method 1.
/// Returns None if not found within the limit.
#[must_use]
pub fn find_pid_advance(seed: u32, pid: u32, limit: u32) -> Option<u32> {
    let target_low = (pid & 0xFFFF) as u16;
    let target_high = (pid >> 16) as u16;

    let mut rng = Lcrng::new(seed);

    for advance in 0..=limit {
        let state = rng.state();
        let mut test_rng = Lcrng::new(state);

        let low = (test_rng.step() >> 16) as u16;
        let high = (test_rng.step() >> 16) as u16;

        if low == target_low && high == target_high {
            return Some(advance);
        }

        rng.step();
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    const TID: u16 = 9610;
    const SID: u16 = 48293;

    /// Test vector from SPEC section 3
    struct TestVector {
        advance: u32,
        pid: u32,
        nature: Nature,
        ivs: [u8; 6], // HP, Atk, Def, SpA, SpD, Spe
        square: bool,
    }

    fn spec_vectors() -> Vec<TestVector> {
        vec![
            TestVector {
                advance: 5281,
                pid: 0xEF0E7625,
                nature: Nature::Careful,
                ivs: [5, 25, 9, 19, 8, 16],
                square: false,
            },
            TestVector {
                advance: 6988,
                pid: 0x6D8DF4A1,
                nature: Nature::Calm,
                ivs: [13, 18, 31, 28, 11, 7],
                square: false,
            },
            TestVector {
                advance: 7378,
                pid: 0x95DE0CF1,
                nature: Nature::Naive,
                ivs: [3, 6, 31, 25, 6, 14],
                square: true,
            },
            TestVector {
                advance: 7906,
                pid: 0x70D2E9FF,
                nature: Nature::Bold,
                ivs: [13, 11, 9, 28, 29, 28],
                square: false,
            },
            TestVector {
                advance: 9719,
                pid: 0xED007428,
                nature: Nature::Adamant,
                ivs: [6, 17, 14, 9, 24, 17],
                square: false,
            },
            TestVector {
                advance: 14202,
                pid: 0x73FAEAD1,
                nature: Nature::Adamant,
                ivs: [19, 20, 15, 5, 8, 12],
                square: false,
            },
            TestVector {
                advance: 26065,
                pid: 0x22BFBB92,
                nature: Nature::Jolly,
                ivs: [10, 1, 18, 21, 16, 18],
                square: false,
            },
        ]
    }

    #[test]
    fn test_method1_spec_vectors() {
        for v in spec_vectors() {
            let pokemon = generate_method1(0, v.advance, TID, SID);

            assert_eq!(
                pokemon.pid, v.pid,
                "Advance {}: PID mismatch, got {:08X}, expected {:08X}",
                v.advance, pokemon.pid, v.pid
            );

            assert_eq!(
                pokemon.nature, v.nature,
                "Advance {}: Nature mismatch, got {:?}, expected {:?}",
                v.advance, pokemon.nature, v.nature
            );

            assert_eq!(
                pokemon.ivs.hp, v.ivs[0],
                "Advance {}: HP IV mismatch",
                v.advance
            );
            assert_eq!(
                pokemon.ivs.atk, v.ivs[1],
                "Advance {}: Atk IV mismatch",
                v.advance
            );
            assert_eq!(
                pokemon.ivs.def, v.ivs[2],
                "Advance {}: Def IV mismatch",
                v.advance
            );
            assert_eq!(
                pokemon.ivs.spa, v.ivs[3],
                "Advance {}: SpA IV mismatch",
                v.advance
            );
            assert_eq!(
                pokemon.ivs.spd, v.ivs[4],
                "Advance {}: SpD IV mismatch",
                v.advance
            );
            assert_eq!(
                pokemon.ivs.spe, v.ivs[5],
                "Advance {}: Spe IV mismatch",
                v.advance
            );

            assert!(
                pokemon.shiny,
                "Advance {}: should be shiny",
                v.advance
            );

            assert_eq!(
                pokemon.square_shiny, v.square,
                "Advance {}: square shiny mismatch",
                v.advance
            );
        }
    }

    #[test]
    fn test_method1_dead_seed() {
        // From SPEC: seed 0xDEAD, first shiny at advance 1479, PID D967404E, Quiet
        let pokemon = generate_method1(0xDEAD, 1479, TID, SID);

        assert_eq!(pokemon.pid, 0xD967404E);
        assert_eq!(pokemon.nature, Nature::Quiet);
        assert!(pokemon.shiny);
    }

    #[test]
    fn test_find_pid_advance() {
        // Find the advance for each SPEC vector PID
        for v in spec_vectors() {
            let found = find_pid_advance(0, v.pid, 30000);
            assert_eq!(
                found,
                Some(v.advance),
                "PID {:08X}: expected advance {}, got {:?}",
                v.pid,
                v.advance,
                found
            );
        }
    }

    #[test]
    fn test_find_pid_dead_seed() {
        let found = find_pid_advance(0xDEAD, 0xD967404E, 5000);
        assert_eq!(found, Some(1479));
    }

    #[test]
    fn test_higher_advances() {
        // From SPEC: shinies at 40323 (Serious, 87081E22), 44447, 61958, 73641, 75947, 81094
        let pokemon = generate_method1(0, 40323, TID, SID);
        assert_eq!(pokemon.pid, 0x87081E22);
        assert_eq!(pokemon.nature, Nature::Serious);
        assert!(pokemon.shiny);
    }
}
