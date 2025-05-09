
import { useState } from "react";
import { Calendar, Filter, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { utilityService } from "@/lib/supabase";
import { toast } from "sonner";
import { UtilityEntry } from "@/lib/types";

interface DeleteUtilitiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteComplete: () => void;
  entries: UtilityEntry[];
}

export function DeleteUtilitiesDialog({
  isOpen,
  onClose,
  onDeleteComplete,
  entries
}: DeleteUtilitiesDialogProps) {
  const [supplier, setSupplier] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [utilityType, setUtilityType] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);

  // Get unique suppliers and utility types from entries
  const suppliers = [...new Set(entries.map(e => e.supplier))];
  const utilityTypes = [...new Set(entries.map(e => e.utilityType))];

  // Reset state when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetState();
      onClose();
    }
  };

  const resetState = () => {
    setSupplier("");
    setStartDate(undefined);
    setEndDate(undefined);
    setUtilityType("");
    setIsConfirming(false);
    setIsDeleting(false);
    setDeleteAll(false);
  };

  // Get filtered entries based on criteria
  const getFilteredEntries = () => {
    let filtered = [...entries];
    
    if (supplier) {
      filtered = filtered.filter(e => e.supplier === supplier);
    }
    
    if (utilityType) {
      filtered = filtered.filter(e => e.utilityType === utilityType);
    }
    
    if (startDate) {
      filtered = filtered.filter(e => new Date(e.readingDate) >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.readingDate) <= endDate);
    }
    
    return filtered;
  };

  // Handle delete operation
  const handleDelete = async () => {
    if (deleteAll) {
      setIsDeleting(true);
      try {
        const result = await utilityService.deleteAllEntries();
        if (result) {
          toast.success("All utility entries have been deleted");
          onDeleteComplete();
        } else {
          toast.error("Failed to delete all entries");
        }
      } catch (error) {
        console.error("Error deleting all entries:", error);
        toast.error("An error occurred while deleting entries");
      } finally {
        setIsDeleting(false);
        onClose();
      }
      return;
    }
    
    const entriesToDelete = getFilteredEntries();
    
    if (entriesToDelete.length === 0) {
      toast.error("No entries match the selected criteria");
      return;
    }
    
    setIsDeleting(true);
    let successCount = 0;
    let failedCount = 0;
    
    try {
      for (const entry of entriesToDelete) {
        const success = await utilityService.deleteEntry(entry.id!);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} entries`);
        onDeleteComplete();
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} entries`);
      }
    } catch (error) {
      console.error("Error deleting entries:", error);
      toast.error("An error occurred while deleting entries");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  const filteredCount = getFilteredEntries().length;
  const anyFilterApplied = supplier || utilityType || startDate || endDate;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Utility Entries</DialogTitle>
          <DialogDescription>
            {isConfirming ? 
              "Please confirm you want to delete the selected entries." : 
              "Select criteria for entries you want to delete."}
          </DialogDescription>
        </DialogHeader>
        
        {!isConfirming && (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="delete-all" 
                checked={deleteAll}
                onCheckedChange={(checked) => setDeleteAll(checked as boolean)}
              />
              <Label 
                htmlFor="delete-all" 
                className="text-red-500 font-medium cursor-pointer"
              >
                Delete all utility entries
              </Label>
            </div>
            
            {!deleteAll && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Filter by supplier</Label>
                  <Select 
                    value={supplier} 
                    onValueChange={setSupplier}
                  >
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All suppliers</SelectItem>
                      {suppliers.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="utility-type">Filter by utility type</Label>
                  <Select 
                    value={utilityType} 
                    onValueChange={setUtilityType}
                  >
                    <SelectTrigger id="utility-type">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {utilityTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>To date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          disabled={(date) => 
                            startDate ? date < startDate : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {anyFilterApplied && (
                  <div className="text-sm mt-4 p-2 bg-gray-100 rounded">
                    <span className="font-medium">{filteredCount}</span> entries match these criteria
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {isConfirming && (
          <div className="py-6 text-center">
            <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
              <p className="font-medium">
                {deleteAll ? 
                  "You are about to delete ALL utility entries." :
                  `You are about to delete ${filteredCount} entries.`
                }
              </p>
              <p className="text-sm mt-2">This action cannot be undone.</p>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex items-center justify-end space-x-2">
          {isConfirming ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsConfirming(false)}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setIsConfirming(true)}
                disabled={!deleteAll && filteredCount === 0}
                className="flex items-center"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteAll ? "Delete All" : "Delete Selected"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteUtilitiesDialog;
