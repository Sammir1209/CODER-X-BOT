// utils/jitter.ts
// Simple jitter utility to introduce random delays mimicking human behavior.
// Used throughout the automation flow to avoid deterministic timing patterns.

/**
 * Returns a random delay in milliseconds between `min` and `max`.
 * If `min` and `max` are omitted, uses the JITTER_CONFIG from constants.
 */
export function getJitterDelay(min?: number, max?: number): number {
  // Import constants lazily to avoid circular dependencies.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { JITTER_CONFIG } = require('../utils/constants') as any;
  const minMs = typeof min === 'number' ? min : JITTER_CONFIG.MIN_PERCENTAGE * 1000;
  const maxMs = typeof max === 'number' ? max : JITTER_CONFIG.MAX_PERCENTAGE * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Sleeps for a jittered amount of time.
 */
export function sleepJitter(min?: number, max?: number): Promise<void> {
  const delay = getJitterDelay(min, max);
  return new Promise((resolve) => setTimeout(resolve, delay));
}
