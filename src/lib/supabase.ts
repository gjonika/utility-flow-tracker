
import { supabase } from '@/integrations/supabase/client';
import { UtilityEntry } from './types';
import { toast } from 'sonner';

// Local storage keys
const UTILITY_ENTRIES_KEY = 'utility_entries';
const UTILITY_SUPPLIERS_KEY = 'utility_suppliers';
const UNSYNCED_ENTRIES_KEY = 'unsynced_utility_entries';

// Check if we're online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Map our app model to Supabase schema
const mapToSupabaseModel = (entry: UtilityEntry) => {
  return {
    id: entry.id,
    utilitytype: entry.utilityType,
    supplier: entry.supplier,
    readingdate: entry.readingDate,
    reading: entry.reading,
    unit: entry.unit,
    amount: entry.amount,
    notes: entry.notes,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt
  };
};

// Map from Supabase model to our app model
const mapFromSupabaseModel = (record: any): UtilityEntry => {
  return {
    id: record.id,
    utilityType: record.utilitytype,
    supplier: record.supplier,
    readingDate: record.readingdate,
    reading: record.reading,
    unit: record.unit,
    amount: record.amount,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    synced: true
  };
};

// Utility data service
export const utilityService = {
  // Get all entries from Supabase or localStorage
  async getEntries(): Promise<UtilityEntry[]> {
    try {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('utility_entries')
          .select('*')
          .order('readingdate', { ascending: false });
        
        if (error) {
          console.error('Error fetching entries from Supabase:', error);
          // Fallback to local storage
          return this.getLocalEntries();
        }
        
        // Map data to our app model and update local storage
        const mappedData = data.map(mapFromSupabaseModel);
        localStorage.setItem(UTILITY_ENTRIES_KEY, JSON.stringify(mappedData));
        return mappedData;
      } else {
        return this.getLocalEntries();
      }
    } catch (error) {
      console.error('Error in getEntries:', error);
      return this.getLocalEntries();
    }
  },
  
  // Get entries from localStorage
  getLocalEntries(): UtilityEntry[] {
    try {
      const storedEntries = localStorage.getItem(UTILITY_ENTRIES_KEY);
      return storedEntries ? JSON.parse(storedEntries) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },
  
  // Save an entry to Supabase and/or localStorage
  async saveEntry(entry: UtilityEntry): Promise<UtilityEntry> {
    try {
      const now = new Date().toISOString();
      const entryToSave = {
        ...entry,
        updatedAt: now,
        createdAt: entry.createdAt || now
      };
      
      if (isOnline()) {
        // Map to Supabase model before saving
        const supabaseEntry = mapToSupabaseModel(entryToSave);
        
        // Try to save to Supabase first
        const { data, error } = await supabase
          .from('utility_entries')
          .upsert([supabaseEntry])
          .select()
          .single();
        
        if (error) {
          console.error('Error saving to Supabase:', error);
          return this.saveLocalEntry({...entryToSave, synced: false});
        }
        
        // Map back from Supabase model
        const savedEntry = mapFromSupabaseModel(data);
        
        // Update local cache
        const entries = this.getLocalEntries();
        const updatedEntries = entries.filter(e => e.id !== savedEntry.id);
        updatedEntries.push(savedEntry);
        localStorage.setItem(UTILITY_ENTRIES_KEY, JSON.stringify(updatedEntries));
        
        return savedEntry;
      } else {
        // Offline mode
        return this.saveLocalEntry({...entryToSave, synced: false});
      }
    } catch (error) {
      console.error('Error in saveEntry:', error);
      return this.saveLocalEntry({...entry, synced: false});
    }
  },
  
  // Save entry locally
  saveLocalEntry(entry: UtilityEntry): UtilityEntry {
    try {
      const entries = this.getLocalEntries();
      const now = new Date().toISOString();
      
      // If no ID, generate a temporary one
      if (!entry.id) {
        entry.id = `local-${Date.now()}`;
        entry.createdAt = now;
      }
      
      entry.updatedAt = now;
      
      // Replace or add entry
      const updatedEntries = entries.filter(e => e.id !== entry.id);
      updatedEntries.push(entry);
      
      localStorage.setItem(UTILITY_ENTRIES_KEY, JSON.stringify(updatedEntries));
      
      // Track unsynced entries
      if (!entry.synced) {
        const unsynced = this.getUnsyncedEntries();
        const updatedUnsynced = unsynced.filter(e => e.id !== entry.id);
        updatedUnsynced.push(entry);
        localStorage.setItem(UNSYNCED_ENTRIES_KEY, JSON.stringify(updatedUnsynced));
      }
      
      return entry;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast.error('Failed to save entry locally');
      return entry;
    }
  },
  
  // Delete an entry
  async deleteEntry(id: string): Promise<boolean> {
    try {
      if (isOnline() && !id.startsWith('local-')) {
        const { error } = await supabase
          .from('utility_entries')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting from Supabase:', error);
          return false;
        }
      }
      
      // Always remove from local storage
      const entries = this.getLocalEntries();
      const updatedEntries = entries.filter(e => e.id !== id);
      localStorage.setItem(UTILITY_ENTRIES_KEY, JSON.stringify(updatedEntries));
      
      // Remove from unsynced if present
      const unsynced = this.getUnsyncedEntries();
      const updatedUnsynced = unsynced.filter(e => e.id !== id);
      localStorage.setItem(UNSYNCED_ENTRIES_KEY, JSON.stringify(updatedUnsynced));
      
      return true;
    } catch (error) {
      console.error('Error in deleteEntry:', error);
      return false;
    }
  },
  
  // Get unsynced entries
  getUnsyncedEntries(): UtilityEntry[] {
    try {
      const unsynced = localStorage.getItem(UNSYNCED_ENTRIES_KEY);
      return unsynced ? JSON.parse(unsynced) : [];
    } catch (error) {
      console.error('Error getting unsynced entries:', error);
      return [];
    }
  },
  
  // Sync unsynced entries to Supabase
  async syncUnsyncedEntries(): Promise<number> {
    if (!isOnline()) return 0;
    
    try {
      const unsynced = this.getUnsyncedEntries();
      if (unsynced.length === 0) return 0;
      
      let syncedCount = 0;
      
      for (const entry of unsynced) {
        const entryToSync = {...entry};
        
        // Handle local IDs
        if (entry.id?.startsWith('local-')) {
          delete entryToSync.id;
        }
        
        entryToSync.synced = true;
        
        // Map to Supabase model
        const supabaseEntry = mapToSupabaseModel(entryToSync);
        
        const { data, error } = await supabase
          .from('utility_entries')
          .upsert([supabaseEntry])
          .select()
          .single();
        
        if (!error) {
          // Map from Supabase model
          const syncedEntry = mapFromSupabaseModel(data);
          
          // Remove from unsynced and update local entry
          const remaining = this.getUnsyncedEntries().filter(e => e.id !== entry.id);
          localStorage.setItem(UNSYNCED_ENTRIES_KEY, JSON.stringify(remaining));
          
          // Update local entries
          const localEntries = this.getLocalEntries();
          const updatedEntries = localEntries.filter(e => e.id !== entry.id);
          updatedEntries.push(syncedEntry);
          localStorage.setItem(UTILITY_ENTRIES_KEY, JSON.stringify(updatedEntries));
          
          syncedCount++;
        }
      }
      
      return syncedCount;
    } catch (error) {
      console.error('Error syncing entries:', error);
      return 0;
    }
  },
};

// Network status listener
export function setupNetworkListeners() {
  window.addEventListener('online', async () => {
    const count = await utilityService.syncUnsyncedEntries();
    if (count > 0) {
      toast.success(`Synced ${count} entries to the cloud`);
    }
  });
}
