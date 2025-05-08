
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UtilityForm } from "@/components/UtilityForm";
import { UtilityHistory } from "@/components/UtilityHistory";
import { UtilityChart } from "@/components/UtilityChart";
import { utilityService, setupUtilityNetworkListeners } from "@/lib/supabase";
import { UtilityEntry } from "@/lib/types";
import { toast } from "sonner";

const Index = () => {
  const [entries, setEntries] = useState<UtilityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [chartEntries, setChartEntries] = useState<UtilityEntry[]>([]);

  useEffect(() => {
    // Setup network listeners for offline/online handling
    setupUtilityNetworkListeners();
    
    // Load initial data
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await utilityService.getEntries();
      setEntries(data);
    } catch (error) {
      console.error("Error loading entries:", error);
      toast.error("Failed to load utility entries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuccess = (entry: UtilityEntry) => {
    setEntries(prev => [entry, ...prev]);
    setIsAddFormOpen(false);
  };

  const handleViewCharts = (filteredEntries: UtilityEntry[]) => {
    setChartEntries(filteredEntries);
    setShowCharts(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Utility Flow Tracker</h1>
            <p className="text-gray-600 mt-1">
              Track your utility usage and payments
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setIsAddFormOpen(true)}>
              Add New Entry
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 max-w-[400px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["electricity", "water", "gas", "internet"].map((utilityType) => {
                const typeEntries = entries.filter(entry => entry.utilityType === utilityType);
                const latestEntry = typeEntries.length > 0 
                  ? typeEntries.reduce((latest, entry) => 
                      new Date(entry.readingDate) > new Date(latest.readingDate) ? entry : latest
                    , typeEntries[0])
                  : null;
                
                return (
                  <Card key={utilityType} className={`border-l-4 border-utility-${utilityType}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg capitalize">{utilityType}</CardTitle>
                      {latestEntry && (
                        <CardDescription>
                          {latestEntry.supplier}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {latestEntry ? (
                        <div>
                          <div className="text-2xl font-bold">
                            ${latestEntry.amount.toFixed(2)}
                          </div>
                          {latestEntry.reading !== null && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Reading: {latestEntry.reading} {latestEntry.unit}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          No entries yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your most recent utility entries</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading entries...</div>
                ) : entries.length > 0 ? (
                  <div className="space-y-4">
                    <UtilityHistory 
                      entries={entries.slice(0, 5)}
                      onRefresh={loadEntries}
                      onViewCharts={handleViewCharts}
                    />
                    {entries.length > 5 && (
                      <div className="text-center">
                        <Button variant="outline" onClick={() => setActiveTab("history")}>
                          View All Entries
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No utility entries found.</p>
                    <Button onClick={() => setIsAddFormOpen(true)}>
                      Add Your First Entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {entries.length > 0 && (
              <UtilityChart entries={entries} />
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {isLoading ? (
              <div className="text-center py-8">Loading entries...</div>
            ) : (
              <UtilityHistory 
                entries={entries}
                onRefresh={loadEntries}
                onViewCharts={handleViewCharts}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Entry Dialog */}
      <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <UtilityForm
            onSuccess={handleAddSuccess}
            onCancel={() => setIsAddFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Charts Dialog */}
      <Dialog open={showCharts} onOpenChange={setShowCharts}>
        <DialogContent className="max-w-[900px]">
          <UtilityChart entries={chartEntries} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
