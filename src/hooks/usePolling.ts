import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

/** Polls an API endpoint every `interval` ms and returns the data */
export function usePolling<T>(path: string, interval = 6000, enabled = true): T | null {
  const [data, setData] = useState<T | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const fetch = useCallback(async () => {
    try {
      const result = await api.get<T>(pathRef.current);
      setData(result);
    } catch {
      // silently fail on background polls
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setData(null);
    fetch();
    const id = setInterval(fetch, interval);
    return () => clearInterval(id);
  }, [fetch, interval, enabled, path]);

  return data;
}
