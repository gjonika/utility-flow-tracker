
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  UtilityEntry, 
  NewUtilityEntrySchema, 
  UtilityType, 
  NewUtilityEntry 
} from "@/lib/types";
import { utilityService } from "@/lib/supabase";
import { toast } from "sonner";

interface UtilityFormProps {
  initialData?: UtilityEntry;
  onSuccess?: (entry: UtilityEntry) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const utilityTypeOptions: {label: string, value: UtilityType, unit?: string}[] = [
  { label: "Electricity", value: "electricity", unit: "kWh" },
  { label: "Water", value: "water", unit: "m³" },
  { label: "Gas", value: "gas", unit: "m³" },
  { label: "Internet", value: "internet" },
  { label: "Other", value: "other" }
];

export function UtilityForm({ initialData, onSuccess, onCancel, isEditing = false }: UtilityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast: hookToast } = useToast();

  const form = useForm<NewUtilityEntry>({
    resolver: zodResolver(NewUtilityEntrySchema),
    defaultValues: initialData || {
      utilityType: "electricity",
      supplier: "",
      readingDate: format(new Date(), "yyyy-MM-dd"),
      reading: null,
      unit: "kWh",
      amount: 0,
      notes: ""
    }
  });

  // Update unit based on selected utility type
  const handleUtilityTypeChange = (type: UtilityType) => {
    const option = utilityTypeOptions.find(opt => opt.value === type);
    form.setValue("utilityType", type);
    if (option?.unit) {
      form.setValue("unit", option.unit);
    } else {
      form.setValue("unit", "");
    }
  };

  // Handle form submission
  const onSubmit = async (data: NewUtilityEntry) => {
    setIsSubmitting(true);
    try {
      const entryToSave: UtilityEntry = {
        ...data,
        ...(initialData?.id ? { id: initialData.id } : {}),
        synced: false
      };
      
      const savedEntry = await utilityService.saveEntry(entryToSave);
      
      toast.success(isEditing 
        ? "Utility entry updated successfully" 
        : "New utility entry added successfully");
        
      if (onSuccess) {
        onSuccess(savedEntry);
      }
    } catch (error) {
      console.error("Error saving utility entry:", error);
      toast.error("Failed to save utility entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Utility Entry" : "Add New Utility Entry"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="utilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utility Type</FormLabel>
                    <Select
                      onValueChange={(value) => handleUtilityTypeChange(value as UtilityType)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select utility type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {utilityTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="readingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Reading Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(field.value)}
                          onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meter Reading</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter meter reading" 
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. kWh, m³" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter payment amount" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default UtilityForm;
