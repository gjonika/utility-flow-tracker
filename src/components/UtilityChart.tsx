
import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtilityEntry } from "@/lib/types";
import { ChartFilter } from "./utility/chart/ChartFilter";
import { ChartCanvas } from "./utility/chart/ChartCanvas";
import { useUtilityChartData } from "./utility/chart/useUtilityChartData";

interface UtilityChartProps {
  entries: UtilityEntry[];
}

export function UtilityChart({ entries }: UtilityChartProps) {
  const {
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
  } = useUtilityChartData(entries);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Utility Trends</CardTitle>
            <CardDescription>Track your utility usage and payments over time</CardDescription>
          </div>
          <ChartFilter 
            chartType={chartType}
            setChartType={setChartType}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            filterType={filterType}
            setFilterType={setFilterType}
            availableUtilityTypes={availableUtilityTypes}
          />
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
            <ChartCanvas 
              chartData={chartData}
              chartType={chartType}
              activeTypes={activeTypes}
              utilityColors={utilityColors}
              view="payment"
            />
          </TabsContent>
          
          <TabsContent value="usage" className="mt-0">
            <ChartCanvas 
              chartData={chartData}
              chartType={chartType}
              activeTypes={activeTypes}
              utilityColors={utilityColors}
              view="usage"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default UtilityChart;
