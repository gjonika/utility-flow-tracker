
/**
 * Supabase integration for Utility Flow Tracker
 */

import { supabase } from '@/integrations/supabase/client';
import { utilityService } from './utilityService';
import { setupNetworkListeners } from './network';

// Export supabase client
export { supabase };

// Re-export utility service and network listeners
export { utilityService, setupNetworkListeners };

// Export network listener setup function that uses the utility service
export function setupUtilityNetworkListeners() {
  setupNetworkListeners(() => utilityService.syncUnsyncedEntries());
}
