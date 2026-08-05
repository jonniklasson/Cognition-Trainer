/**
 * Human reaction time benchmarks for alphabet sequencing tasks.
 *
 * These values represent typical response times observed in human subjects
 * performing sequential-memory retrieval tasks. They serve as performance
 * reference points — responses faster than the target indicate automatic
 * (random-access) recall; slower responses suggest sequential recitation.
 *
 * These are intentionally read-only constants and should NOT be modified
 * at runtime. They are derived from cognitive psychology benchmarks for
 * serial order memory tasks.
 *
 * Sources:
 *  - Parkman & Groen (1971): alphabet naming latencies
 *  - Klahr, Chase & Lovelace (1983): serial position effects in alphabet recall
 */

/** Target response time for easy mode (ms).
 *  Easy mode uses the full A–Z pool. Edge letters (A, B, Y, Z) are recalled
 *  quickly even by sequential searchers (~800–1200 ms), so the benchmark
 *  is set to 1500 ms. Responses under this value indicate automatic access. */
export const EASY_TARGET_MS = 1500 as const;

/** Target response time for hard mode (ms).
 *  Hard mode weights toward mid-alphabet letters (E–V), which require
 *  longer sequential recitation to reach. Typical human latency for
 *  mid-alphabet letters is 1800–2500 ms when reciting mentally.
 *  The benchmark is set to 2000 ms — faster responses indicate genuine
 *  random-access recall of mid-sequence positions. */
export const HARD_TARGET_MS = 2000 as const;

/** Minimum plausible human reaction time (ms).
 *  No genuine letter-identification response is faster than ~150 ms;
 *  faster values are treated as accidental keypresses. */
export const MIN_VALID_RESPONSE_MS = 150 as const;
