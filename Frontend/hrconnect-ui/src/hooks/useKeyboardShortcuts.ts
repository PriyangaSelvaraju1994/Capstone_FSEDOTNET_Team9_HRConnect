import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  handler: () => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Registers keyboard shortcuts for navigation and actions.
 * Automatically ignores events when typing in input fields.
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { shortcuts, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function onKey(e: KeyboardEvent) {
      // Ignore when typing in input/textarea/contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }

      const shortcut = shortcuts.find((s) => s.key.toLowerCase() === e.key.toLowerCase());
      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcuts, enabled]);
}
