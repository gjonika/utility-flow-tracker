
import { useState, useEffect } from "react";
import { UtilityEntry } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export function useUtilityHistory(entries: UtilityEntry[]) {
  const [filteredEntries, setFilteredEntries] = useState<UtilityEntry[]>(entries);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [availableUtilityTypes, setAvailableUtilityTypes] = useState<string[]>([]);

  // Filter entries when search term or filter type changes
  useEffect(() => {
    filterEntries(entries, searchTerm, filterType);
  }, [entries, searchTerm, filterType]);

  // Load utility types from Supabase
  useEffect(() => {
    const loadUtilityTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('utility_entries')
          .select('utilitytype')
          .not('utilitytype', 'is', null);

        if (error) {
          console.error('Error fetching utility types:', error);
          return;
        }

        // Extract unique utility types
        const uniqueTypes = [...new Set(data.map(item => item.utilitytype))];
        setAvailableUtilityTypes(uniqueTypes);
      } catch (error) {
        console.error('Error loading utility types:', error);
      }
    };

    loadUtilityTypes();
  }, []);

  const filterEntries = (entries: UtilityEntry[], term: string, type: string) => {
    let filtered = [...entries];
    
    // Filter by utility type
    if (type !== "all") {
      filtered = filtered.filter(entry => entry.utilityType === type);
    }
    
    // Filter by search term
    if (term.trim()) {
      const lowercaseTerm = term.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.supplier.toLowerCase().includes(lowercaseTerm) ||
        (entry.notes && entry.notes.toLowerCase().includes(lowercaseTerm))
      );
    }
    
    setFilteredEntries(filtered);
  };
  
  // Default utility colors
  const defaultColors: Record<string, string> = {
    electricity: "text-utility-electricity",
    water: "text-utility-water",
    gas: "text-utility-gas",
    internet: "text-utility-internet",
    heat: "text-utility-heat",
    hot_water: "text-utility-hot-water",
    cold_water: "text-utility-cold-water",
    phone: "text-utility-phone",
    housing_service: "text-utility-housing",
    renovation: "text-utility-renovation", 
    loan: "text-utility-loan",
    interest: "text-utility-interest",
    insurance: "text-utility-insurance",
    waste: "text-utility-waste",
    other: "text-utility"
  };

  // Default utility background colors
  const defaultBgColors: Record<string, string> = {
    electricity: "bg-utility-electricity/10",
    water: "bg-utility-water/10",
    gas: "bg-utility-gas/10",
    internet: "bg-utility-internet/10",
    heat: "bg-utility-heat/10",
    hot_water: "bg-utility-hot-water/10",
    cold_water: "bg-utility-cold-water/10",
    phone: "bg-utility-phone/10",
    housing_service: "bg-utility-housing/10",
    renovation: "bg-utility-renovation/10",
    loan: "bg-utility-loan/10",
    interest: "bg-utility-interest/10",
    insurance: "bg-utility-insurance/10",
    waste: "bg-utility-waste/10",
    other: "bg-utility/10"
  };

  const getUtilityColor = (type: string): string => {
    return defaultColors[type] || "text-primary";
  };

  const getUtilityBgColor = (type: string): string => {
    return defaultBgColors[type] || "bg-primary/10";
  };

  return {
    filteredEntries,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    availableUtilityTypes,
    colorScheme: { getUtilityColor, getUtilityBgColor }
  };
}

export default useUtilityHistory;
