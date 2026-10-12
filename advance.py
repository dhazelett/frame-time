#!/usr/bin/env python3
"""
Stopgap helper for Emerald seed-0 RNG (until the real app exists).

Usage:
  python3 advance.py rng  A3C4FF79            -> current advance for an RNG value read at 03005D80
  python3 advance.py goto A3C4FF79 5200       -> frames to step from that value to reach advance 5200,
                                                 plus the RNG value you should see when you get there
  python3 advance.py pid  EF0E7625            -> which advance (seed 0, Method 1) generates this PID
  python3 advance.py near 5281 15             -> RNG values for advances 5281-15 .. 5281 (so you can
                                                 recognise the stop point while frame-stepping)

Constants: LCRNG next = cur * 0x41C64E6D + 0x6073 (mod 2^32); seed 0 at boot.
"""
import sys

M, A = 0x41C64E6D, 0x6073
MASK = 0xFFFFFFFF
LIMIT = 5_000_000


def step(x):
    return (x * M + A) & MASK


def state_at(n):
    s = 0
    for _ in range(n):
        s = step(s)
    return s


def find_advance(value, limit=LIMIT):
    s = 0
    for n in range(limit + 1):
        if s == value:
            return n
        s = step(s)
    return None


def find_pid(pid, limit=LIMIT):
    s = 0
    for n in range(limit + 1):
        a = step(s)
        b = step(a)
        if ((b >> 16) << 16 | (a >> 16)) == pid:
            return n
        s = step(s)
    return None


def hx(s):
    return int(s, 16)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return
    cmd = sys.argv[1]
    if cmd == "rng":
        n = find_advance(hx(sys.argv[2]))
        print(f"advance {n}" if n is not None else f"not found in first {LIMIT:,} seed-0 advances")
    elif cmd == "goto":
        cur = find_advance(hx(sys.argv[2]))
        tgt = int(sys.argv[3])
        if cur is None:
            print("current value not found in the seed-0 chain")
            return
        print(f"current advance {cur}; target {tgt}; frames to step: {tgt - cur}")
        print(f"RNG value at target: {state_at(tgt):08X}")
    elif cmd == "pid":
        n = find_pid(hx(sys.argv[2]))
        print(f"Method 1 advance {n}" if n is not None else "PID not found (wrong method or not seed 0)")
    elif cmd == "near":
        tgt = int(sys.argv[2])
        span = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        s = state_at(tgt - span)
        for n in range(tgt - span, tgt + 1):
            print(f"{n:6d}  {s:08X}")
            s = step(s)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
