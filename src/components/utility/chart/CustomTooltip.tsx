
import React from "react";
import { format, parseISO } from "date-fns";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  view: 'usage' | 'payment';
}

export function CustomTooltip({ active, payload, label, view }: CustomTooltipProps) {
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
}

export default CustomTooltip;
