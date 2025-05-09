
import React from "react";

interface ChartEmptyStateProps {
  message?: string;
}

export function ChartEmptyState({ message = "No data available for the selected filters" }: ChartEmptyStateProps) {
  return (
    <div className="text-center py-20 text-muted-foreground">
      {message}
    </div>
  );
}

export default ChartEmptyState;
