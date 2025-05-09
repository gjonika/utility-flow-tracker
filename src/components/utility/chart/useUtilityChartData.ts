
import { useState, useMemo, useEffect } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { UtilityEntry } from "@/lib/types";

// Default utility colors
const DEFAULT_COLORS: Record<string, string> = {
  electricity: "#4361EE",
  water: "#4CC9F0",
  gas: "#F72585",
  internet: "#7209B7",
  heat: "#FF9E00",
  hot_water: "#48CAE4",
  cold_water: "#90E0EF",
  phone: "#9D4EDD",
  housing_service: "#ADB5BD",
  renovation: "#FF006E",
  loan: "#8338EC",
  interest: "#3A86FF",
  insurance: "#FB8500",
  waste: "#38B000",
  other: "#6C757D"
};

export function useUtilityChartData(entries: UtilityEntry[]) {
  const [availableUtilityTypes, setAvailableUtilityTypes] = useState<string[]>([]);
  const [utilityColors, setUtilityColors] = useState<Record<string, string>>(DEFAULT_COLORS);
  const [view, setView] = useState<'usage' | 'payment'>('payment');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<string>("12");
  const [filterType, setFilterType] = useState<string>("all");

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

        // Generate colors for any utility types not in DEFAULT_COLORS
        const newColors = { ...utilityColors };
        uniqueTypes.forEach(type => {
          if (!newColors[type]) {
            newColors[type] = "#6C757D"; // Default gray for unknown types
          }
        });
        setUtilityColors(newColors);
      } catch (error) {
        console.error('Error loading utility types:', error);
      }
    };

    loadUtilityTypes();
  }, []);

  // Process data for charts
  const chartData = useMemo(() => {
    if (!entries.length) return [];

    // Filter entries based on time range
    const monthsAgo = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);
    
    let filteredEntries = entries.filter(entry => 
      new Date(entry.readingDate) >= cutoffDate
    );

    // Further filter by utility type if specified
    if (filterType !== "all") {
      filteredEntries = filteredEntries.filter(entry => 
        entry.utilityType === filterType
      );
    }

    // Group entries by month
    const entriesByMonth: Record<string, UtilityEntry[]> = {};
    
    filteredEntries.forEach(entry => {
      const date = new Date(entry.readingDate);
      const monthKey = format(startOfMonth(date), "yyyy-MM");
      
      if (!entriesByMonth[monthKey]) {
        entriesByMonth[monthKey] = [];
      }
      
      entriesByMonth[monthKey].push(entry);
    });

    // Create chart data array
    return Object.entries(entriesByMonth).map(([monthKey, monthEntries]) => {
      const chartPoint: any = {
        date: monthKey,
        month: format(parseISO(monthKey), "MMM yyyy")
      };
      
      // Group by utility type within each month
      const byType: Record<string, { amount: number, reading: number | null }> = {};
      
      monthEntries.forEach(entry => {
        if (!byType[entry.utilityType]) {
          byType[entry.utilityType] = { amount: 0, reading: null };
        }
        
        byType[entry.utilityType].amount += entry.amount;
        
        // For usage charts, use the latest reading for the month
        if (entry.reading !== null) {
          byType[entry.utilityType].reading = entry.reading;
        }
      });
      
      // Add amounts/readings to chart point
      Object.entries(byType).forEach(([type, data]) => {
        chartPoint[type] = view === 'payment' ? data.amount : data.reading;
      });
      
      return chartPoint;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, view, timeRange, filterType]);

  // Get active utility types in the filtered data
  const activeTypes = useMemo(() => {
    const types = new Set<string>();
    
    if (filterType !== "all") {
      types.add(filterType);
    } else {
      chartData.forEach(point => {
        Object.keys(point).forEach(key => {
          if (key !== 'date' && key !== 'month' && point[key] !== undefined) {
            types.add(key);
          }
        });
      });
    }
    
    return Array.from(types);
  }, [chartData, filterType]);

  return {
    chartData,
    activeTypes,
    availableUtilityTypes,
    utilityColors,
    view,
    setView,
    chartType,
    setChartType,
    timeRange,
    setTimeRange,
    filterType,
    setFilterType
  };
}

export default useUtilityChartData;
