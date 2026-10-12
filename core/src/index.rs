//! Advance index for fast state -> advance lookup.
//!
//! For Emerald (seed 0), we precompute a hash map of RNG states to their
//! advance numbers. This lets us instantly convert an RNG value read from
//! emulator memory into "you are at advance N".

use std::collections::HashMap;

use crate::lcrng::Lcrng;

/// Precomputed index mapping RNG states to advance numbers.
pub struct AdvanceIndex {
    map: HashMap<u32, u32>,
    seed: u32,
    max_advance: u32,
}

impl AdvanceIndex {
    /// Build an index for the given seed up to max_advance.
    ///
    /// For Emerald with seed 0 and max 1_000_000, this takes ~40MB of memory
    /// and builds in under a second.
    #[must_use]
    pub fn build(seed: u32, max_advance: u32) -> Self {
        let mut map = HashMap::with_capacity(max_advance as usize + 1);
        let mut rng = Lcrng::new(seed);

        // Include advance 0 (the seed itself)
        map.insert(rng.state(), 0);

        for advance in 1..=max_advance {
            rng.step();
            map.insert(rng.state(), advance);
        }

        Self {
            map,
            seed,
            max_advance,
        }
    }

    /// Build an Emerald index (seed 0) up to max_advance.
    #[must_use]
    pub fn emerald(max_advance: u32) -> Self {
        Self::build(0, max_advance)
    }

    /// Look up the advance number for a given RNG state.
    /// Returns None if the state is not in the index (wrong seed or beyond max).
    #[must_use]
    pub fn lookup(&self, state: u32) -> Option<u32> {
        self.map.get(&state).copied()
    }

    /// Get the seed this index was built for.
    #[must_use]
    pub const fn seed(&self) -> u32 {
        self.seed
    }

    /// Get the maximum advance in this index.
    #[must_use]
    pub const fn max_advance(&self) -> u32 {
        self.max_advance
    }

    /// Check if a state is in the index.
    #[must_use]
    pub fn contains(&self, state: u32) -> bool {
        self.map.contains_key(&state)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lookup_round_trip() {
        let index = AdvanceIndex::emerald(10000);

        // Verify round-trip: state_at(n) -> lookup -> n
        let test_advances = [0, 1, 100, 503, 5281, 6988, 7378, 9999, 10000];

        for &advance in &test_advances {
            let state = Lcrng::state_after(0, advance);
            let found = index.lookup(state);
            assert_eq!(
                found,
                Some(advance),
                "Round-trip failed for advance {}: state {:08X} -> {:?}",
                advance,
                state,
                found
            );
        }
    }

    #[test]
    fn test_lookup_known_values() {
        let index = AdvanceIndex::emerald(1000);

        // From SPEC section 10: RNG at advance 503 is A3C4FF79
        assert_eq!(index.lookup(0xA3C4FF79), Some(503));

        // Seed 0 at advance 0
        assert_eq!(index.lookup(0), Some(0));

        // First few advances
        assert_eq!(index.lookup(0x00006073), Some(1));
        assert_eq!(index.lookup(0xE97E7B6A), Some(2));
    }

    #[test]
    fn test_lookup_not_found() {
        let index = AdvanceIndex::emerald(100);

        // State beyond max_advance
        let state_at_200 = Lcrng::state_after(0, 200);
        assert_eq!(index.lookup(state_at_200), None);

        // Random value not on the chain
        assert_eq!(index.lookup(0xDEADBEEF), None);
    }

    #[test]
    fn test_different_seed() {
        let index = AdvanceIndex::build(0xDEAD, 2000);

        // Should find states on the DEAD chain
        let state = Lcrng::state_after(0xDEAD, 1479);
        assert_eq!(index.lookup(state), Some(1479));

        // Should NOT find states on seed-0 chain
        assert_eq!(index.lookup(0xA3C4FF79), None);
    }
}
