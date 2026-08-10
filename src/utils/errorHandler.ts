/**
 * Utility for wrapping async operations with consistent error handling, optional logging and retries.
 *
 * @param fn        The async function to execute.
 * @param context   A short string describing the operation – used in log messages.
 * @param retries   Number of retry attempts on failure (default 0 – no retry).
 * @returns         The resolved value of `fn` or `null` if all attempts fail.
 */
export async function handleAsync<T>(fn: () => Promise<T>, context: string, retries = 0): Promise<T | null> {
  const DEBUG = typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production';
  let attempt = 0;
  const maxAttempts = retries + 1; // initial try + retries

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (e) {
      if (DEBUG) {
        console.warn(`[StorageAdapter] ${context} failed (attempt ${attempt + 1}/${maxAttempts}):`, e);
      }
      attempt += 1;
      if (attempt >= maxAttempts) {
        if (DEBUG) {
          console.error(`[StorageAdapter] ${context} ultimately failed after ${maxAttempts} attempts`);
        }
        return null;
      }
      // exponential back‑off (500ms, 1000ms, 1500ms, ...)
      const delay = 500 * attempt;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}
