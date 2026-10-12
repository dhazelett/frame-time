//! Gen 3 Linear Congruential Random Number Generator.
//!
//! Constants: next = current * 0x41C64E6D + 0x6073 (mod 2^32)
//! Emerald always starts with seed 0.

use serde::{Deserialize, Serialize};

/// LCRNG multiplier constant.
pub const MULT: u32 = 0x41C64E6D;

/// LCRNG increment constant.
pub const INC: u32 = 0x6073;

/// Gen 3 LCRNG state wrapper.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Lcrng {
    state: u32,
}

impl Lcrng {
    /// Create a new LCRNG with the given seed.
    #[must_use]
    pub const fn new(seed: u32) -> Self {
        Self { state: seed }
    }

    /// Create a new LCRNG with seed 0 (Emerald's fixed initial seed).
    #[must_use]
    pub const fn emerald() -> Self {
        Self::new(0)
    }

    /// Get the current state.
    #[must_use]
    pub const fn state(&self) -> u32 {
        self.state
    }

    /// Advance the RNG by one step and return the new state.
    pub fn step(&mut self) -> u32 {
        self.state = self.state.wrapping_mul(MULT).wrapping_add(INC);
        self.state
    }

    /// Get the high 16 bits of the current state (the "random" value).
    #[must_use]
    pub const fn rand16(&self) -> u16 {
        (self.state >> 16) as u16
    }

    /// Advance by n steps.
    pub fn advance(&mut self, n: u32) {
        for _ in 0..n {
            self.step();
        }
    }

    /// Advance by n steps and return the final state.
    pub fn advance_to(&mut self, n: u32) -> u32 {
        self.advance(n);
        self.state
    }

    /// Compute the state after n advances from a given seed, without mutation.
    #[must_use]
    pub fn state_after(seed: u32, advances: u32) -> u32 {
        let mut rng = Self::new(seed);
        rng.advance(advances);
        rng.state()
    }
}

impl Default for Lcrng {
    fn default() -> Self {
        Self::emerald()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_first_states_from_seed_0() {
        // From SPEC.md section 2: first LCRNG states from seed 0
        let expected: [u32; 6] = [
            0x00006073, 0xE97E7B6A, 0x52713895, 0x31B0DDE4, 0x8E425287, 0xE2CCA5EE,
        ];

        let mut rng = Lcrng::emerald();
        for (i, &exp) in expected.iter().enumerate() {
            let state = rng.step();
            assert_eq!(
                state, exp,
                "Mismatch at advance {}: got {:08X}, expected {:08X}",
                i + 1,
                state,
                exp
            );
        }
    }

    #[test]
    fn test_advances_14_to_23() {
        // From SPEC.md section 4: advances 14-23 confirmed in mGBA
        let expected: [u32; 10] = [
            0x993D6BB6, 0x7ABCB0F1, 0xCBA72510, 0x5DD60843, 0x91784EFA, 0x27A62CE5,
            0x618D43F4, 0x1692A757, 0xCFB8227E, 0x375D7419,
        ];

        let mut rng = Lcrng::emerald();
        rng.advance(14);

        for (i, &exp) in expected.iter().enumerate() {
            assert_eq!(
                rng.state(),
                exp,
                "Mismatch at advance {}: got {:08X}, expected {:08X}",
                14 + i,
                rng.state(),
                exp
            );
            rng.step();
        }
    }

    #[test]
    fn test_state_after() {
        // Verify state_after matches sequential advancement
        let mut rng = Lcrng::emerald();
        rng.advance(503);
        let sequential = rng.state();

        let direct = Lcrng::state_after(0, 503);
        assert_eq!(sequential, direct);

        // From SPEC.md section 10: RNG at advance 503 is A3C4FF79
        assert_eq!(direct, 0xA3C4FF79);
    }
}
