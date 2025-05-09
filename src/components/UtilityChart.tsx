import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { UtilityEntry } from "@/lib/types";

interface UtilityChartProps {
  entries: UtilityEntry[];
}

type ChartData = {
  date: string;
  [key: string]: any;
};

// Default utility colors - will be supplemented with dynamically loaded types
const defaultColors: Record<string, string> = {
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

export function UtilityChart({ entries }: UtilityChartProps) {
  const [view, setView] = useState<'usage' | 'payment'>('payment');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<string>("12");
  const [filterType, setFilterType] = useState<string>("all");
  const [availableUtilityTypes, setAvailableUtilityTypes] = useState<string[]>([]);
  const [utilityColors, setUtilityColors] = useState<Record<string, string>>(defaultColors);

  // Load utility types from Supabase
  useEffect(() => {
    const loadUtilityTypes = async () => {
      try {
        // Fix: Remove the .is() method and use a simpler query
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

        // Generate colors for any utility types not in defaultColors
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
      const chartPoint: ChartData = {
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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-sm">
          <p className="font-medium">{format(parseISO(label), "MMMM yyyy")}</p>
          <div className="mt-2 space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center">
                <div 
                  className="w-3 h-3 mr-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="capitalize">{entry.name}: </span>
                <span className="ml-1 font-medium">
                  {view === 'payment' ? `$${entry.value.toFixed(2)}` : entry.value}
                  {view === 'usage' && entry.name === 'electricity' && ' kWh'}
                  {view === 'usage' && (entry.name === 'water' || entry.name === 'gas') && ' m³'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Utility Trends</CardTitle>
            <CardDescription>Track your utility usage and payments over time</CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Select value={chartType} onValueChange={(value) => setChartType(value as 'line' | 'bar')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
                <SelectItem value="24">24 Months</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Utility Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableUtilityTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(value) => setView(value as 'usage' | 'payment')}>
          <div className="flex justify-center mb-4">
            <TabsList>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="payment" className="mt-0">
            {chartData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), "MMM yyyy")}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {activeTypes.map((type) => (
                        <Line
                          key={type}
                          type="monotone"
                          dataKey={type}
                          name={type}
                          stroke={utilityColors[type] || "#6C757D"}
                          activeDot={{ r: 6 }}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), "MMM yyyy")}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {activeTypes.map((type) => (
                        <Bar
                          key={type}
                          dataKey={type}
                          name={type}
                          fill={utilityColors[type] || "#6C757D"}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                No payment data available for the selected filters
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="usage" className="mt-0">
            {chartData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), "MMM yyyy")}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {activeTypes.map((type) => (
                        <Line
                          key={type}
                          type="monotone"
                          dataKey={type}
                          name={type}
                          stroke={utilityColors[type] || "#6C757D"}
                          activeDot={{ r: 6 }}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), "MMM yyyy")}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {activeTypes.map((type) => (
                        <Bar
                          key={type}
                          dataKey={type}
                          name={type}
                          fill={utilityColors[type] || "#6C757D"}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                No usage data available for the selected filters
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default UtilityChart;
