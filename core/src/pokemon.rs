//! Pokemon data structures for Gen 3.

use serde::{Deserialize, Serialize};

/// Pokemon nature (PID % 25).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u8)]
pub enum Nature {
    Hardy = 0,
    Lonely = 1,
    Brave = 2,
    Adamant = 3,
    Naughty = 4,
    Bold = 5,
    Docile = 6,
    Relaxed = 7,
    Impish = 8,
    Lax = 9,
    Timid = 10,
    Hasty = 11,
    Serious = 12,
    Jolly = 13,
    Naive = 14,
    Modest = 15,
    Mild = 16,
    Quiet = 17,
    Bashful = 18,
    Rash = 19,
    Calm = 20,
    Gentle = 21,
    Sassy = 22,
    Careful = 23,
    Quirky = 24,
}

impl Nature {
    /// Get the nature from a PID.
    #[must_use]
    pub const fn from_pid(pid: u32) -> Self {
        // SAFETY: pid % 25 is always 0-24, matching our enum variants
        match pid % 25 {
            0 => Self::Hardy,
            1 => Self::Lonely,
            2 => Self::Brave,
            3 => Self::Adamant,
            4 => Self::Naughty,
            5 => Self::Bold,
            6 => Self::Docile,
            7 => Self::Relaxed,
            8 => Self::Impish,
            9 => Self::Lax,
            10 => Self::Timid,
            11 => Self::Hasty,
            12 => Self::Serious,
            13 => Self::Jolly,
            14 => Self::Naive,
            15 => Self::Modest,
            16 => Self::Mild,
            17 => Self::Quiet,
            18 => Self::Bashful,
            19 => Self::Rash,
            20 => Self::Calm,
            21 => Self::Gentle,
            22 => Self::Sassy,
            23 => Self::Careful,
            24 => Self::Quirky,
            _ => unreachable!(),
        }
    }

    /// Get the nature's name as a string.
    #[must_use]
    pub const fn name(&self) -> &'static str {
        match self {
            Self::Hardy => "Hardy",
            Self::Lonely => "Lonely",
            Self::Brave => "Brave",
            Self::Adamant => "Adamant",
            Self::Naughty => "Naughty",
            Self::Bold => "Bold",
            Self::Docile => "Docile",
            Self::Relaxed => "Relaxed",
            Self::Impish => "Impish",
            Self::Lax => "Lax",
            Self::Timid => "Timid",
            Self::Hasty => "Hasty",
            Self::Serious => "Serious",
            Self::Jolly => "Jolly",
            Self::Naive => "Naive",
            Self::Modest => "Modest",
            Self::Mild => "Mild",
            Self::Quiet => "Quiet",
            Self::Bashful => "Bashful",
            Self::Rash => "Rash",
            Self::Calm => "Calm",
            Self::Gentle => "Gentle",
            Self::Sassy => "Sassy",
            Self::Careful => "Careful",
            Self::Quirky => "Quirky",
        }
    }
}

/// Individual Values (IVs) for a Pokemon.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Ivs {
    pub hp: u8,
    pub atk: u8,
    pub def: u8,
    pub spa: u8,
    pub spd: u8,
    pub spe: u8,
}

impl Ivs {
    /// Create IVs from the two 16-bit IV words (Method 1 order).
    /// Word 1: HP (0-4), Atk (5-9), Def (10-14)
    /// Word 2: Spe (0-4), SpA (5-9), SpD (10-14)
    #[must_use]
    pub const fn from_iv_words(iv1: u16, iv2: u16) -> Self {
        Self {
            hp: (iv1 & 0x1F) as u8,
            atk: ((iv1 >> 5) & 0x1F) as u8,
            def: ((iv1 >> 10) & 0x1F) as u8,
            spe: (iv2 & 0x1F) as u8,
            spa: ((iv2 >> 5) & 0x1F) as u8,
            spd: ((iv2 >> 10) & 0x1F) as u8,
        }
    }
}

/// A generated Pokemon with all relevant data.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Pokemon {
    pub pid: u32,
    pub nature: Nature,
    pub ivs: Ivs,
    pub ability_slot: u8, // 0 or 1
    pub shiny: bool,
    pub square_shiny: bool, // (xor == 0), rarer sparkle in later gens
}

impl Pokemon {
    /// Check if a PID is shiny for the given TID/SID.
    /// Shiny iff (TID ^ SID ^ PID_high ^ PID_low) < 8
    #[must_use]
    pub const fn is_shiny(pid: u32, tid: u16, sid: u16) -> bool {
        let pid_high = (pid >> 16) as u16;
        let pid_low = (pid & 0xFFFF) as u16;
        let xor = tid ^ sid ^ pid_high ^ pid_low;
        xor < 8
    }

    /// Check if a PID is a square shiny (xor == 0).
    #[must_use]
    pub const fn is_square_shiny(pid: u32, tid: u16, sid: u16) -> bool {
        let pid_high = (pid >> 16) as u16;
        let pid_low = (pid & 0xFFFF) as u16;
        let xor = tid ^ sid ^ pid_high ^ pid_low;
        xor == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nature_from_pid() {
        // From SPEC: PID EF0E7625 should be Careful (23)
        assert_eq!(Nature::from_pid(0xEF0E7625), Nature::Careful);
        // 0xEF0E7625 = 4010698277, 4010698277 % 25 = 23 (Careful)

        // PID 6D8DF4A1 should be Calm (20)
        assert_eq!(Nature::from_pid(0x6D8DF4A1), Nature::Calm);

        // PID 95DE0CF1 should be Naive (14)
        assert_eq!(Nature::from_pid(0x95DE0CF1), Nature::Naive);

        // PID 70D2E9FF should be Bold (5)
        assert_eq!(Nature::from_pid(0x70D2E9FF), Nature::Bold);

        // PID ED007428 should be Adamant (3)
        assert_eq!(Nature::from_pid(0xED007428), Nature::Adamant);

        // PID 87081E22 should be Serious (12)
        assert_eq!(Nature::from_pid(0x87081E22), Nature::Serious);

        // PID D967404E should be Quiet (17)
        assert_eq!(Nature::from_pid(0xD967404E), Nature::Quiet);

        // PID 22BFBB92 should be Jolly (13)
        assert_eq!(Nature::from_pid(0x22BFBB92), Nature::Jolly);
    }

    #[test]
    fn test_shiny_check() {
        // TID 9610 / SID 48293
        let tid: u16 = 9610;
        let sid: u16 = 48293;

        // These PIDs should all be shiny for this TID/SID (from SPEC section 3)
        let shiny_pids: [u32; 7] = [
            0xEF0E7625, // advance 5281
            0x6D8DF4A1, // advance 6988
            0x95DE0CF1, // advance 7378 (square)
            0x70D2E9FF, // advance 7906
            0xED007428, // advance 9719
            0x73FAEAD1, // advance 14202
            0x22BFBB92, // advance 26065
        ];

        for pid in shiny_pids {
            assert!(
                Pokemon::is_shiny(pid, tid, sid),
                "PID {:08X} should be shiny",
                pid
            );
        }

        // Advance 7378 (0x95DE0CF1) should be square shiny
        assert!(Pokemon::is_square_shiny(0x95DE0CF1, tid, sid));

        // Non-square shinies should not be square
        assert!(!Pokemon::is_square_shiny(0xEF0E7625, tid, sid));
    }

    #[test]
    fn test_shiny_dead_seed() {
        // From SPEC: seed 0xDEAD, first shiny at advance 1479, PID D967404E
        // We need different TID/SID for this - but actually SPEC says
        // "A second independent check on seed 0xDEAD also matched (first shiny at advance 1479, PID D967404E, Quiet)"
        // This uses the same TID 9610 / SID 48293
        let tid: u16 = 9610;
        let sid: u16 = 48293;

        assert!(Pokemon::is_shiny(0xD967404E, tid, sid));
        assert_eq!(Nature::from_pid(0xD967404E), Nature::Quiet);
    }
}
