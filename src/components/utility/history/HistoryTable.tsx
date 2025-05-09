
import React from "react";
import { format } from "date-fns";
import { EditIcon, TrashIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UtilityEntry } from "@/lib/types";

interface UtilityColorScheme {
  getUtilityColor: (type: string) => string;
  getUtilityBgColor: (type: string) => string;
}

interface HistoryTableProps {
  entries: UtilityEntry[];
  colorScheme: UtilityColorScheme;
  onEditEntry: (entry: UtilityEntry) => void;
  onDeleteEntry: (entry: UtilityEntry) => void;
}

export function HistoryTable({
  entries,
  colorScheme,
  onEditEntry,
  onDeleteEntry
}: HistoryTableProps) {
  const { getUtilityColor, getUtilityBgColor } = colorScheme;
  
  return (
    <div className="rounded-md border overflow-auto max-h-[32rem]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Reading</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <div className={`${getUtilityBgColor(entry.utilityType)} ${getUtilityColor(entry.utilityType)} inline-flex items-center rounded-full px-2 py-1 text-xs font-medium`}>
                  {entry.utilityType.charAt(0).toUpperCase() + entry.utilityType.slice(1).replace('_', ' ')}
                </div>
              </TableCell>
              <TableCell className="font-medium">{entry.supplier}</TableCell>
              <TableCell>
                {format(new Date(entry.readingDate), "MMM d, yyyy")}
                {!entry.synced && <span className="ml-2 text-xs text-yellow-500">(not synced)</span>}
              </TableCell>
              <TableCell>
                {entry.reading !== null ? `${entry.reading} ${entry.unit || ''}` : "—"}
              </TableCell>
              <TableCell>${entry.amount.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      ...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditEntry(entry)}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteEntry(entry)}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default HistoryTable;
