import { useState, useEffect } from 'react';

export function useSyncedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
    // Dispatch a custom event so other components in the same tab can react
    window.dispatchEvent(new Event(`local-storage-${key}`));
  }, [key, state]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    
    const handleLocalChange = () => {
      const stored = localStorage.getItem(key);
      if (stored) {
        setState(JSON.parse(stored));
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(`local-storage-${key}`, handleLocalChange);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(`local-storage-${key}`, handleLocalChange);
    };
  }, [key]);

  return [state, setState] as const;
}
