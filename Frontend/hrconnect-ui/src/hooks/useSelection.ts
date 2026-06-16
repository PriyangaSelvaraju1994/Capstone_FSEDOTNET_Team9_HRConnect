import { useState, useCallback } from 'react';

export interface UseSelectionOptions<T> {
  items: T[];
  initialSelectedId?: string | null;
  getId: (item: T) => string;
  autoSelectFirst?: boolean;
}

export interface SelectionState<T> {
  selectedId: string | null;
  selected: T | null;
  setSelectedId: (id: string | null) => void;
  selectNext: () => void;
  selectPrev: () => void;
  selectFirst: () => void;
  selectLast: () => void;
}

/**
 * Manages selection state in a list with keyboard navigation support.
 * Automatically handles bounds checking and provides navigation helpers.
 */
export function useSelection<T>(
  options: UseSelectionOptions<T>,
): SelectionState<T> {
  const { items, initialSelectedId = null, getId } = options;
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  const selected = items.find((item) => getId(item) === selectedId) ?? null;

  const selectNext = useCallback(() => {
    if (items.length === 0) return;
    const idx = items.findIndex((item) => getId(item) === selectedId);
    if (idx >= 0 && idx < items.length - 1) {
      setSelectedId(getId(items[idx + 1]));
    }
  }, [items, selectedId, getId]);

  const selectPrev = useCallback(() => {
    if (items.length === 0) return;
    const idx = items.findIndex((item) => getId(item) === selectedId);
    if (idx > 0) {
      setSelectedId(getId(items[idx - 1]));
    }
  }, [items, selectedId, getId]);

  const selectFirst = useCallback(() => {
    if (items.length > 0) {
      setSelectedId(getId(items[0]));
    }
  }, [items, getId]);

  const selectLast = useCallback(() => {
    if (items.length > 0) {
      setSelectedId(getId(items[items.length - 1]));
    }
  }, [items, getId]);

  return {
    selectedId,
    selected,
    setSelectedId,
    selectNext,
    selectPrev,
    selectFirst,
    selectLast,
  };
}
