//! Target search for finding Pokemon that match criteria.

use serde::{Deserialize, Serialize};

use crate::generator::generate_method1;
use crate::lcrng::Lcrng;
use crate::pokemon::{Nature, Pokemon};

/// Search criteria for finding target Pokemon.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SearchCriteria {
    /// Only match shiny Pokemon.
    pub shiny: bool,
    /// Only match square shiny Pokemon.
    pub square_shiny: bool,
    /// Match any of these natures (empty = any nature).
    pub natures: Vec<Nature>,
    /// Minimum IVs (HP, Atk, Def, SpA, SpD, Spe). None = no minimum.
    pub min_ivs: Option<[u8; 6]>,
    /// Maximum IVs. None = no maximum.
    pub max_ivs: Option<[u8; 6]>,
}

impl SearchCriteria {
    /// Create criteria for finding any shiny.
    #[must_use]
    pub fn shiny() -> Self {
        Self {
            shiny: true,
            ..Default::default()
        }
    }

    /// Create criteria for finding a shiny with specific natures.
    #[must_use]
    pub fn shiny_with_natures(natures: Vec<Nature>) -> Self {
        Self {
            shiny: true,
            natures,
            ..Default::default()
        }
    }

    /// Check if a Pokemon matches these criteria.
    #[must_use]
    pub fn matches(&self, pokemon: &Pokemon) -> bool {
        // Shiny check
        if self.shiny && !pokemon.shiny {
            return false;
        }
        if self.square_shiny && !pokemon.square_shiny {
            return false;
        }

        // Nature check
        if !self.natures.is_empty() && !self.natures.contains(&pokemon.nature) {
            return false;
        }

        // IV checks
        if let Some(min) = &self.min_ivs {
            if pokemon.ivs.hp < min[0]
                || pokemon.ivs.atk < min[1]
                || pokemon.ivs.def < min[2]
                || pokemon.ivs.spa < min[3]
                || pokemon.ivs.spd < min[4]
                || pokemon.ivs.spe < min[5]
            {
                return false;
            }
        }

        if let Some(max) = &self.max_ivs {
            if pokemon.ivs.hp > max[0]
                || pokemon.ivs.atk > max[1]
                || pokemon.ivs.def > max[2]
                || pokemon.ivs.spa > max[3]
                || pokemon.ivs.spd > max[4]
                || pokemon.ivs.spe > max[5]
            {
                return false;
            }
        }

        true
    }
}

/// A search result hit.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHit {
    /// The advance number where this Pokemon is generated.
    pub advance: u32,
    /// The RNG state at this advance.
    pub state: u32,
    /// The generated Pokemon.
    pub pokemon: Pokemon,
}

/// Search for Pokemon matching criteria within an advance range.
///
/// Returns hits sorted by advance (earliest first).
#[must_use]
pub fn find_targets(
    seed: u32,
    tid: u16,
    sid: u16,
    criteria: &SearchCriteria,
    min_advance: u32,
    max_advance: u32,
) -> Vec<SearchHit> {
    let mut hits = Vec::new();
    let mut rng = Lcrng::new(seed);

    // Advance to min_advance
    rng.advance(min_advance);

    for advance in min_advance..=max_advance {
        let state = rng.state();
        let pokemon = generate_method1(seed, advance, tid, sid);

        if criteria.matches(&pokemon) {
            hits.push(SearchHit {
                advance,
                state,
                pokemon,
            });
        }

        rng.step();
    }

    hits
}

/// Convenience function to find all shinies in a range.
#[must_use]
pub fn find_shinies(
    seed: u32,
    tid: u16,
    sid: u16,
    min_advance: u32,
    max_advance: u32,
) -> Vec<SearchHit> {
    find_targets(seed, tid, sid, &SearchCriteria::shiny(), min_advance, max_advance)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TID: u16 = 9610;
    const SID: u16 = 48293;

    #[test]
    fn test_find_shinies_spec_vectors() {
        // Find all shinies up to advance 30000 and verify against SPEC section 3
        let hits = find_shinies(0, TID, SID, 0, 30000);

        let expected_advances: [u32; 7] = [5281, 6988, 7378, 7906, 9719, 14202, 26065];
        let expected_pids: [u32; 7] = [
            0xEF0E7625,
            0x6D8DF4A1,
            0x95DE0CF1,
            0x70D2E9FF,
            0xED007428,
            0x73FAEAD1,
            0x22BFBB92,
        ];

        assert_eq!(
            hits.len(),
            7,
            "Expected 7 shinies, found {}",
            hits.len()
        );

        for (i, hit) in hits.iter().enumerate() {
            assert_eq!(
                hit.advance, expected_advances[i],
                "Hit {}: expected advance {}, got {}",
                i, expected_advances[i], hit.advance
            );
            assert_eq!(
                hit.pokemon.pid, expected_pids[i],
                "Hit {}: expected PID {:08X}, got {:08X}",
                i, expected_pids[i], hit.pokemon.pid
            );
            assert!(hit.pokemon.shiny, "Hit {} should be shiny", i);
        }
    }

    #[test]
    fn test_find_square_shiny() {
        // Advance 7378 should be the only square shiny in the first 30000
        let criteria = SearchCriteria {
            square_shiny: true,
            ..Default::default()
        };
        let hits = find_targets(0, TID, SID, &criteria, 0, 30000);

        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].advance, 7378);
        assert_eq!(hits[0].pokemon.pid, 0x95DE0CF1);
        assert!(hits[0].pokemon.square_shiny);
    }

    #[test]
    fn test_find_shiny_adamant() {
        // Find shiny Adamant Pokemon
        let criteria = SearchCriteria::shiny_with_natures(vec![Nature::Adamant]);
        let hits = find_targets(0, TID, SID, &criteria, 0, 30000);

        // Should find advances 9719 and 14202
        assert_eq!(hits.len(), 2);
        assert_eq!(hits[0].advance, 9719);
        assert_eq!(hits[1].advance, 14202);

        for hit in &hits {
            assert!(hit.pokemon.shiny);
            assert_eq!(hit.pokemon.nature, Nature::Adamant);
        }
    }

    #[test]
    fn test_find_with_min_ivs() {
        // Find shinies with at least 20 in Atk
        let criteria = SearchCriteria {
            shiny: true,
            min_ivs: Some([0, 20, 0, 0, 0, 0]),
            ..Default::default()
        };
        let hits = find_targets(0, TID, SID, &criteria, 0, 30000);

        // Advance 5281 has Atk 25, 14202 has Atk 20
        assert!(hits.iter().any(|h| h.advance == 5281));
        assert!(hits.iter().any(|h| h.advance == 14202));

        for hit in &hits {
            assert!(hit.pokemon.ivs.atk >= 20);
        }
    }

    #[test]
    fn test_search_range() {
        // Search only in a narrow range
        let hits = find_shinies(0, TID, SID, 7000, 8000);

        // Should find 7378 and 7906
        assert_eq!(hits.len(), 2);
        assert_eq!(hits[0].advance, 7378);
        assert_eq!(hits[1].advance, 7906);
    }

    #[test]
    fn test_dead_seed_search() {
        // Find first shiny on DEAD seed
        let hits = find_shinies(0xDEAD, TID, SID, 0, 2000);

        assert!(!hits.is_empty());
        assert_eq!(hits[0].advance, 1479);
        assert_eq!(hits[0].pokemon.pid, 0xD967404E);
    }

    #[test]
    fn test_higher_advance_shinies() {
        // From SPEC: shinies at 40323, 44447, 61958, 73641, 75947, 81094
        let hits = find_shinies(0, TID, SID, 40000, 82000);

        let expected: [u32; 6] = [40323, 44447, 61958, 73641, 75947, 81094];

        assert_eq!(hits.len(), 6);
        for (i, &adv) in expected.iter().enumerate() {
            assert_eq!(hits[i].advance, adv);
        }

        // Verify advance 40323 specifically
        assert_eq!(hits[0].pokemon.pid, 0x87081E22);
        assert_eq!(hits[0].pokemon.nature, Nature::Serious);
    }
}
