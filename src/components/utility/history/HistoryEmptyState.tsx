
import React from "react";

interface HistoryEmptyStateProps {
  isFiltering: boolean;
}

export function HistoryEmptyState({ isFiltering }: HistoryEmptyStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      {isFiltering 
        ? "No entries match your search criteria" 
        : "No utility entries found. Add your first entry!"}
    </div>
  );
}

export default HistoryEmptyState;
