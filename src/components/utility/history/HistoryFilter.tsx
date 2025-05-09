
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistoryFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  availableUtilityTypes: string[];
}

export function HistoryFilter({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  availableUtilityTypes
}: HistoryFilterProps) {
  return (
    <div className="mb-4 flex flex-col md:flex-row gap-2">
      <div className="flex-1">
        <Input 
          placeholder="Search suppliers or notes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="w-full md:w-48">
        <Select 
          value={filterType} 
          onValueChange={setFilterType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
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
  );
}

export default HistoryFilter;
