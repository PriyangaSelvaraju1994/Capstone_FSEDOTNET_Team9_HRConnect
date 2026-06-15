import { useCallback } from 'react';

export interface UseConfirmDialogOptions {
  title?: string;
  message: string;
}

/**
 * Hook for showing native confirmation dialogs with consistent messaging.
 * Returns a promise that resolves to true if confirmed, false if cancelled.
 */
export function useConfirmDialog() {
  const confirm = useCallback(
    async (options: UseConfirmDialogOptions): Promise<boolean> => {
      const { message } = options;
      return window.confirm(message);
    },
    [],
  );

  return { confirm };
}
