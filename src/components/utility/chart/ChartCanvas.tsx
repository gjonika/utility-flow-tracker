
import React from "react";
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
import { format, parseISO } from "date-fns";
import { CustomTooltip } from "./CustomTooltip";
import { ChartEmptyState } from "./ChartEmptyState";

interface ChartCanvasProps {
  chartData: any[];
  chartType: 'line' | 'bar';
  activeTypes: string[];
  utilityColors: Record<string, string>;
  view: 'usage' | 'payment';
}

export function ChartCanvas({ 
  chartData, 
  chartType, 
  activeTypes, 
  utilityColors,
  view
}: ChartCanvasProps) {
  
  if (chartData.length === 0) {
    return <ChartEmptyState message={`No ${view} data available for the selected filters`} />;
  }
  
  return (
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
              tickFormatter={view === 'payment' ? (value) => `$${value}` : undefined}
            />
            <Tooltip content={<CustomTooltip view={view} />} />
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
            <YAxis tickFormatter={view === 'payment' ? (value) => `$${value}` : undefined} />
            <Tooltip content={<CustomTooltip view={view} />} />
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
  );
}

export default ChartCanvas;
