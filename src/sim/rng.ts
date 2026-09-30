/**
 * src/sim/rng.ts
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic: same seed always produces same sequence.
 */

export function createRng(seed: number) {
  let s = seed >>> 0;
  return {
    /** Returns float in [0, 1) */
    next(): number {
      s += 0x6d2b79f5;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Returns float in [min, max) */
    range(min: number, max: number): number {
      return min + this.next() * (max - min);
    },
    /** Returns int in [min, max] */
    int(min: number, max: number): number {
      return Math.floor(this.range(min, max + 1));
    },
    /** Gaussian via Box-Muller */
    gaussian(mean: number, std: number): number {
      const u1 = this.next();
      const u2 = this.next();
      const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
      return mean + z * std;
    },
  };
}

export type Rng = ReturnType<typeof createRng>;
