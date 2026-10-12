//! Gen 3 Pokemon RNG core library.
//!
//! This crate provides the core RNG algorithms for Gen 3 Pokemon games:
//! - LCRNG implementation (seed * 0x41C64E6D + 0x6073 mod 2^32)
//! - Method 1 PID/IV generation
//! - Shiny calculation
//! - Advance lookup tables
//! - Target search
//!
//! No I/O, no std::time - fully deterministic and testable.

pub mod generator;
pub mod index;
pub mod lcrng;
pub mod pokemon;
pub mod search;

pub use generator::{find_pid_advance, generate_method1};
pub use index::AdvanceIndex;
pub use lcrng::Lcrng;
pub use pokemon::{Ivs, Nature, Pokemon};
pub use search::{find_shinies, find_targets, SearchCriteria, SearchHit};
