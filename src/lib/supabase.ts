
/**
 * Supabase integration for Utility Flow Tracker
 */

import { utilityService } from './utilityService';
import { setupNetworkListeners } from './network';

// Re-export utility service and network listeners
export { utilityService, setupNetworkListeners };

// Export network listener setup function that uses the utility service
export function setupUtilityNetworkListeners() {
  setupNetworkListeners(() => utilityService.syncUnsyncedEntries());
}
