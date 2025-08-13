
import { useState, useCallback, useEffect } from 'react';

function getStorageValue<T>(key: string, defaultValue: T): T {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse localStorage value for history", e);
      return defaultValue;
    }
  }
  return defaultValue;
}

export const usePersistentHistory = <T,>(storageKey: string, initialPresent: T) => {
  const [timeline, setTimeline] = useState(() => {
    const presentFromStorage = getStorageValue<T>(storageKey, initialPresent);
    return {
      past: [] as T[],
      present: presentFromStorage,
      future: [] as T[],
    };
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(timeline.present));
  }, [storageKey, timeline.present]);

  const canUndo = timeline.past.length > 0;
  const canRedo = timeline.future.length > 0;

  const setState = useCallback((action: T | ((prevState: T) => T)) => {
    setTimeline(current => {
      const newPresent = typeof action === 'function'
        ? (action as (prevState: T) => T)(current.present)
        : action;
      
      if (JSON.stringify(newPresent) === JSON.stringify(current.present)) {
        return current;
      }

      return {
        past: [...current.past, current.present],
        present: newPresent,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setTimeline(current => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setTimeline(current => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      const newFuture = current.future.slice(1);
      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  return { state: timeline.present, setState, undo, redo, canUndo, canRedo };
};
