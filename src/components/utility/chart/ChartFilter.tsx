
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChartFilterProps {
  chartType: 'line' | 'bar';
  setChartType: (type: 'line' | 'bar') => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  availableUtilityTypes: string[];
}

export function ChartFilter({
  chartType,
  setChartType,
  timeRange,
  setTimeRange,
  filterType,
  setFilterType,
  availableUtilityTypes
}: ChartFilterProps) {
  return (
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
  );
}

export default ChartFilter;
