
import { useState } from "react";
import { ChartBarIcon, FileUpIcon, Trash2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UtilityEntry } from "@/lib/types";
import { utilityService } from "@/lib/supabase";
import { toast } from "sonner";
import UtilityForm from "./UtilityForm";
import ImportModal from "./ImportModal";
import { HistoryFilter } from "./utility/history/HistoryFilter";
import { HistoryTable } from "./utility/history/HistoryTable";
import { HistoryEmptyState } from "./utility/history/HistoryEmptyState";
import { DeleteUtilitiesDialog } from "./utility/history/DeleteUtilitiesDialog";
import { useUtilityHistory } from "./utility/history/useUtilityHistory";

interface UtilityHistoryProps {
  entries: UtilityEntry[];
  onRefresh: () => void;
  onViewCharts: (entries: UtilityEntry[]) => void;
}

export function UtilityHistory({ entries, onRefresh, onViewCharts }: UtilityHistoryProps) {
  const {
    filteredEntries,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    availableUtilityTypes,
    colorScheme
  } = useUtilityHistory(entries);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<UtilityEntry | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<UtilityEntry | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteUtilitiesOpen, setIsDeleteUtilitiesOpen] = useState(false);

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

  const handleDeleteUtilitiesComplete = () => {
    onRefresh();
  };

  const isFiltering = searchTerm !== "" || filterType !== "all";

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
              onClick={() => setIsDeleteUtilitiesOpen(true)}
              className="flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Entries
            </Button>
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
          <HistoryFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            availableUtilityTypes={availableUtilityTypes}
          />
          
          {filteredEntries.length === 0 ? (
            <HistoryEmptyState isFiltering={isFiltering} />
          ) : (
            <HistoryTable 
              entries={filteredEntries}
              colorScheme={colorScheme}
              onEditEntry={handleEditEntry}
              onDeleteEntry={confirmDelete}
            />
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
      
      {/* Delete Utilities Dialog */}
      <DeleteUtilitiesDialog 
        isOpen={isDeleteUtilitiesOpen}
        onClose={() => setIsDeleteUtilitiesOpen(false)}
        onDeleteComplete={handleDeleteUtilitiesComplete}
        entries={entries}
      />
    </>
  );
}

export default UtilityHistory;
