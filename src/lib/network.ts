
/**
 * Network status utilities
 */

// Check if we're online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Setup network status listener
export function setupNetworkListeners(onOnline: () => Promise<number>) {
  window.addEventListener('online', async () => {
    const count = await onOnline();
    if (count > 0) {
      import('sonner').then(({ toast }) => {
        toast.success(`Synced ${count} entries to the cloud`);
      });
    }
  });
}
