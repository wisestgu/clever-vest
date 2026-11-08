import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

// Tiny event bus so a mutation on one screen (a deposit, a trade) refreshes data everywhere.
const listeners = new Set<() => void>();
export const invalidate = () => listeners.forEach((fn) => fn());

interface Options {
  /** Poll every N ms while mounted (e.g. pending deposits). */
  poll?: number | false;
  skip?: boolean;
}

export function useApi<T>(path: string | null, { poll = false, skip = false }: Options = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(Boolean(path) && !skip);
  const pathRef = useRef(path);
  pathRef.current = path;

  const load = useCallback(async () => {
    const p = pathRef.current;
    if (!p) return;
    try {
      const result = await api<T>(p);
      if (pathRef.current === p) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (pathRef.current === p) setError(err as Error);
    } finally {
      if (pathRef.current === p) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!path || skip) return;
    setLoading(true);
    load();
  }, [path, skip, load]);

  useEffect(() => {
    if (!path || skip) return;
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [path, skip, load]);

  useEffect(() => {
    if (!poll || !path || skip) return;
    const t = setInterval(load, poll);
    return () => clearInterval(t);
  }, [poll, path, skip, load]);

  return { data, error, loading, reload: load };
}
