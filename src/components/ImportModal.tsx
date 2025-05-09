
import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, UploadCloud, AlertCircle, Check, ArrowRight, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { utilityService } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  CSVRow, 
  ValidatedEntry,
  processCSV, 
  EXPECTED_HEADERS,
  ValidationError
} from "@/lib/utils/csv";
import { UtilityEntry } from "@/lib/types";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [headerErrors, setHeaderErrors] = useState<string[]>([]);
  const [validatedEntries, setValidatedEntries] = useState<ValidatedEntry[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    total: number;
  }>({ success: 0, failed: 0, total: 0 });

  // Clear state when modal closes
  const handleClose = useCallback(() => {
    setContent(null);
    setFileName("");
    setActiveTab("upload");
    setHeaderErrors([]);
    setValidatedEntries([]);
    setIsImporting(false);
    setProgress(0);
    setImportResult({ success: 0, failed: 0, total: 0 });
    onClose();
  }, [onClose]);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setContent(content);
      try {
        const { validatedEntries, headerErrors } = processCSV(content);
        setHeaderErrors(headerErrors);
        setValidatedEntries(validatedEntries);
        
        if (headerErrors.length === 0) {
          setActiveTab("validate");
        }
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error("CSV parsing error:", error);
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  // Count errors
  const errorCount = validatedEntries.reduce(
    (count, entry) => count + entry.errors.length, 
    0
  );

  // Get error for a specific field in a row
  const getFieldError = (rowIndex: number, field: string): ValidationError | undefined => {
    const entry = validatedEntries[rowIndex];
    return entry?.errors.find(err => err.field === field);
  };

  // Handle import button click
  const handleImport = async () => {
    const validEntries = validatedEntries.filter(ve => ve.errors.length === 0);
    
    if (validEntries.length === 0) {
      toast.error("No valid entries to import");
      return;
    }

    setActiveTab("importing");
    setIsImporting(true);
    
    const total = validEntries.length;
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < validEntries.length; i++) {
      const { entry } = validEntries[i];
      
      try {
        if (isValidUtilityEntry(entry)) {
          await utilityService.saveEntry(entry as UtilityEntry);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error("Error importing entry:", error);
        failed++;
      }
      
      // Update progress
      const currentProgress = Math.floor(((i + 1) / total) * 100);
      setProgress(currentProgress);
    }
    
    setImportResult({ success, failed, total });
    setIsImporting(false);
    
    if (success > 0) {
      toast.success(`Successfully imported ${success} entries`);
      onSuccess();
    }
    
    if (failed > 0) {
      toast.error(`Failed to import ${failed} entries`);
    }
  };
  
  // Type guard for UtilityEntry
  const isValidUtilityEntry = (entry: Partial<UtilityEntry>): boolean => {
    return Boolean(
      entry.utilityType &&
      entry.supplier &&
      entry.readingDate &&
      typeof entry.amount === 'number'
    );
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const link = document.createElement("a");
    link.href = "/sample-import.csv";
    link.download = "utility-import-sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle>Import Utility Entries</DialogTitle>
          <DialogDescription>
            Upload a CSV file with utility entries to import.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="validate" disabled={!content || headerErrors.length > 0}>
              Validate
            </TabsTrigger>
            <TabsTrigger value="importing" disabled={!content || errorCount > 0}>
              Import
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="py-4">
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              >
                <input {...getInputProps()} />
                <UploadCloud className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-lg mt-2">Drag and drop a CSV file here, or click to select</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Only .csv files are accepted
                </p>
                
                {fileName && (
                  <div className="mt-4 p-2 bg-gray-100 rounded-md flex items-center justify-between">
                    <span className="font-medium truncate">{fileName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName("");
                        setContent(null);
                        setHeaderErrors([]);
                        setValidatedEntries([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {headerErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Missing required CSV headers:</div>
                    <ul className="list-disc ml-6 mt-2">
                      {headerErrors.map((header) => (
                        <li key={header}>{header}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert>
                <AlertDescription className="flex flex-col gap-2">
                  <p>
                    Your CSV file should include these headers:
                    <code className="bg-gray-200 px-1.5 py-0.5 rounded mx-1 text-xs">
                      {EXPECTED_HEADERS.join(', ')}
                    </code>
                  </p>
                  <div>
                    <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Sample CSV
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="validate" className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{validatedEntries.length} Entries Found</h3>
                  {errorCount > 0 ? (
                    <p className="text-sm text-destructive">
                      {errorCount} errors found. Fix issues before importing.
                    </p>
                  ) : (
                    <p className="text-sm text-green-600">All entries valid. Ready to import.</p>
                  )}
                </div>
                <Button
                  onClick={() => setActiveTab("upload")}
                  variant="outline"
                >
                  Change File
                </Button>
              </div>
              
              <ScrollArea className="h-[400px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reading</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedEntries.map((validatedEntry, index) => {
                      const { rawData } = validatedEntry;
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          
                          <TableCell className={getFieldError(index, "utilitytype") ? "bg-red-50" : ""}>
                            {rawData.utilitytype || ""}
                            {getFieldError(index, "utilitytype") && (
                              <Badge variant="destructive" className="ml-2">Error</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className={getFieldError(index, "supplier") ? "bg-red-50" : ""}>
                            {rawData.supplier || ""}
                            {getFieldError(index, "supplier") && (
                              <Badge variant="destructive" className="ml-2">Error</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className={getFieldError(index, "readingdate") ? "bg-red-50" : ""}>
                            {rawData.readingdate || ""}
                            {getFieldError(index, "readingdate") && (
                              <Badge variant="destructive" className="ml-2">Error</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className={getFieldError(index, "reading") ? "bg-red-50" : ""}>
                            {rawData.reading || ""}
                            {getFieldError(index, "reading") && (
                              <Badge variant="destructive" className="ml-2">Error</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {rawData.unit || ""}
                          </TableCell>
                          
                          <TableCell className={getFieldError(index, "amount") ? "bg-red-50" : ""}>
                            {rawData.amount || ""}
                            {getFieldError(index, "amount") && (
                              <Badge variant="destructive" className="ml-2">Error</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {rawData.notes || ""}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="importing" className="py-4">
            <div className="space-y-8 py-4">
              {isImporting ? (
                <div className="text-center">
                  <h3 className="text-lg font-medium">Importing Entries...</h3>
                  <Progress value={progress} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {progress}% complete
                  </p>
                </div>
              ) : importResult.total > 0 ? (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium">Import Complete</h3>
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="bg-gray-100 p-4 rounded text-center">
                      <div className="text-2xl font-bold">{importResult.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="bg-green-100 p-4 rounded text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.success}
                      </div>
                      <div className="text-xs text-muted-foreground">Successful</div>
                    </div>
                    <div className={`${importResult.failed > 0 ? "bg-red-100" : "bg-gray-100"} p-4 rounded text-center`}>
                      <div className={`text-2xl font-bold ${importResult.failed > 0 ? "text-red-600" : ""}`}>
                        {importResult.failed}
                      </div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>
                  <Button onClick={handleClose}>Close and Refresh Data</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      You are about to import {validatedEntries.filter(ve => ve.errors.length === 0).length} entries.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" onClick={() => setActiveTab("validate")}>
                      Back to Validation
                    </Button>
                    <Button onClick={handleImport}>
                      Start Import <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {activeTab === "upload" && (
            <Button 
              onClick={() => setActiveTab("validate")}
              disabled={!content || headerErrors.length > 0}
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {activeTab === "validate" && !isImporting && (
            <Button 
              onClick={() => setActiveTab("importing")} 
              disabled={errorCount > 0}
            >
              Continue to Import <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImportModal;
