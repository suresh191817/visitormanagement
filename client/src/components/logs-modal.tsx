import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Download, Users, Car } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActivityLog } from "@shared/schema";

interface LogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LogsModal({ open, onOpenChange }: LogsModalProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "visitor" | "vehicle">("all");

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/logs"],
    enabled: open,
  });

  const filteredLogs = logs?.filter((log) => {
    if (activeFilter === "all") return true;
    return log.type === activeFilter;
  }) || [];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const exportLogs = () => {
    if (!logs) return;

    const csvContent = [
      ["Date", "Time", "Type", "Name", "Action"].join(","),
      ...logs.map(log => [
        formatDate(log.timestamp),
        formatTime(log.timestamp),
        log.type,
        log.entityName,
        log.action
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitor-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Entry/Exit Log</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilter === "all"
                  ? "bg-white text-[#1976D2] shadow-sm"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilter === "visitor"
                  ? "bg-white text-[#1976D2] shadow-sm"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveFilter("visitor")}
            >
              Visitors
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilter === "vehicle"
                  ? "bg-white text-[#1976D2] shadow-sm"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveFilter("vehicle")}
            >
              Vehicles
            </button>
          </div>
        </div>

        {/* Logs Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No logs found</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        log.type === "visitor"
                          ? log.action === "ENTRY"
                            ? "bg-[#4CAF50]"
                            : "bg-gray-400"
                          : log.action === "ENTRY"
                          ? "bg-[#FF9800]"
                          : "bg-gray-400"
                      }`}
                    >
                      {log.type === "visitor" ? (
                        <Users className="h-4 w-4 text-white" />
                      ) : (
                        <Car className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{log.entityName}</div>
                    <div className="text-sm text-gray-500">
                      {log.type === "visitor" ? "Visitor" : "Vehicle"} {log.action.toLowerCase()} • {formatTime(log.timestamp)}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge
                      variant={log.action === "ENTRY" ? "default" : "secondary"}
                      className={
                        log.action === "ENTRY"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {log.action === "ENTRY" ? "IN" : "OUT"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="p-6 border-t border-gray-200">
          <Button
            className="w-full bg-[#1976D2] text-white hover:bg-blue-700"
            onClick={exportLogs}
            disabled={!logs || logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
