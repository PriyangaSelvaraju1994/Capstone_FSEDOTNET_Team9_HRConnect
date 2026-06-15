import { useEffect, useState } from 'react';

/**
 * Returns a value that updates only after the input has been stable for
 * `delayMs` milliseconds. Used to throttle search-as-you-type queries.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
