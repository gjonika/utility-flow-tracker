import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChartBarIcon, EditIcon, TrashIcon, FileUpIcon } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UtilityEntry } from "@/lib/types";
import { utilityService } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import UtilityForm from "./UtilityForm";
import ImportModal from "./ImportModal";
import { toast } from "sonner";

interface UtilityHistoryProps {
  entries: UtilityEntry[];
  onRefresh: () => void;
  onViewCharts: (entries: UtilityEntry[]) => void;
}

export function UtilityHistory({ entries, onRefresh, onViewCharts }: UtilityHistoryProps) {
  const [filteredEntries, setFilteredEntries] = useState<UtilityEntry[]>(entries);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<UtilityEntry | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<UtilityEntry | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [availableUtilityTypes, setAvailableUtilityTypes] = useState<string[]>([]);

  useEffect(() => {
    filterEntries(entries, searchTerm, filterType);
  }, [entries, searchTerm, filterType]);

  // Load utility types from Supabase
  useEffect(() => {
    const loadUtilityTypes = async () => {
      try {
        // Get all available utility types from database
        // Fix: Use the .eq() method correctly with a string column name
        const { data, error } = await supabase
          .from('utility_entries')
          .select('utilitytype')
          .is('utilitytype', 'not.null');

        if (error) {
          console.error('Error fetching utility types:', error);
          return;
        }

        // Extract unique utility types
        const uniqueTypes = [...new Set(data.map(item => item.utilitytype))];
        setAvailableUtilityTypes(uniqueTypes);
      } catch (error) {
        console.error('Error loading utility types:', error);
      }
    };

    loadUtilityTypes();
  }, []);

  const filterEntries = (entries: UtilityEntry[], term: string, type: string) => {
    let filtered = [...entries];
    
    // Filter by utility type
    if (type !== "all") {
      filtered = filtered.filter(entry => entry.utilityType === type);
    }
    
    // Filter by search term
    if (term.trim()) {
      const lowercaseTerm = term.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.supplier.toLowerCase().includes(lowercaseTerm) ||
        (entry.notes && entry.notes.toLowerCase().includes(lowercaseTerm))
      );
    }
    
    setFilteredEntries(filtered);
  };

  const handleEditEntry = (entry: UtilityEntry) => {
    setCurrentEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEntry = async (entry: UtilityEntry) => {
    try {
      const success = await utilityService.deleteEntry(entry.id!);
      if (success) {
        toast.success("Entry deleted successfully");
        onRefresh();
      } else {
        toast.error("Failed to delete entry");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleteDialogOpen(false);
      setEntryToDelete(undefined);
    }
  };

  const confirmDelete = (entry: UtilityEntry) => {
    setEntryToDelete(entry);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    setIsEditDialogOpen(false);
    setCurrentEntry(undefined);
    onRefresh();
  };

  const handleImportSuccess = () => {
    setIsImportModalOpen(false);
    onRefresh();
  };

  // Default utility colors - will be supplemented with dynamically loaded types
  const defaultColors: Record<string, string> = {
    electricity: "text-utility-electricity",
    water: "text-utility-water",
    gas: "text-utility-gas",
    internet: "text-utility-internet",
    heat: "text-utility-heat",
    hot_water: "text-utility-hot-water",
    cold_water: "text-utility-cold-water",
    phone: "text-utility-phone",
    housing_service: "text-utility-housing",
    renovation: "text-utility-renovation", 
    loan: "text-utility-loan",
    interest: "text-utility-interest",
    insurance: "text-utility-insurance",
    waste: "text-utility-waste",
    other: "text-utility"
  };

  const getUtilityColor = (type: string): string => {
    return defaultColors[type] || "text-primary";
  };

  // Default utility background colors
  const defaultBgColors: Record<string, string> = {
    electricity: "bg-utility-electricity/10",
    water: "bg-utility-water/10",
    gas: "bg-utility-gas/10",
    internet: "bg-utility-internet/10",
    heat: "bg-utility-heat/10",
    hot_water: "bg-utility-hot-water/10",
    cold_water: "bg-utility-cold-water/10",
    phone: "bg-utility-phone/10",
    housing_service: "bg-utility-housing/10",
    renovation: "bg-utility-renovation/10",
    loan: "bg-utility-loan/10",
    interest: "bg-utility-interest/10",
    insurance: "bg-utility-insurance/10",
    waste: "bg-utility-waste/10",
    other: "bg-utility/10"
  };

  const getUtilityBgColor = (type: string): string => {
    return defaultBgColors[type] || "bg-primary/10";
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Utility History</CardTitle>
            <CardDescription>View and manage your utility entries</CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewCharts(filteredEntries)}
              className="flex items-center"
            >
              <ChartBarIcon className="mr-2 h-4 w-4" />
              View Charts
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center"
            >
              <FileUpIcon className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
          
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterType !== "all" 
                ? "No entries match your search criteria" 
                : "No utility entries found. Add your first entry!"}
            </div>
          ) : (
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
                  {filteredEntries.map((entry) => (
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
                            <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                              <EditIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => confirmDelete(entry)}
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
          )}
          
          <div className="mt-2 text-xs text-muted-foreground">
            Showing {filteredEntries.length} of {entries.length} entries
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Utility Entry</DialogTitle>
            <DialogDescription>
              Make changes to your utility entry.
            </DialogDescription>
          </DialogHeader>
          {currentEntry && (
            <UtilityForm 
              initialData={currentEntry}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => entryToDelete && handleDeleteEntry(entryToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Import CSV Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </>
  );
}

export default UtilityHistory;
