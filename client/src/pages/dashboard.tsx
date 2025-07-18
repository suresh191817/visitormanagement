import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Settings, Users, Car, History, Home, BarChart3, UserPlus, Plus, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VisitorModal from "@/components/visitor-modal";
import VehicleModal from "@/components/vehicle-modal";
import LogsModal from "@/components/logs-modal";
import UserManagementModal from "@/components/user-management-modal";
import { useAuth } from "@/hooks/useAuth";
import { formatTime, formatDateTime } from "@/lib/utils";
import type { Visitor, Vehicle } from "@shared/schema";

interface Stats {
  visitorsInside: number;
  vehiclesInside: number;
}

export default function Dashboard() {
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: visitorsInside, isLoading: visitorsLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors/inside"],
    refetchInterval: 30000,
  });

  const { data: vehiclesInside, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles/inside"],
    refetchInterval: 30000,
  });

  // Query for all visitors and vehicles for the tabs
  const { data: allVisitors, isLoading: allVisitorsLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/visitors"],
    enabled: activeTab === "visitors",
  });

  const { data: allVehicles, isLoading: allVehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    enabled: activeTab === "vehicles",
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case "visitors":
        return renderVisitorsTab();
      case "vehicles":
        return renderVehiclesTab();
      case "reports":
        return renderReportsTab();
      default:
        return renderHomeTab();
    }
  };

  const renderHomeTab = () => (
    <>
      {/* Stats Cards */}
      <div className="px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-[#4CAF50] rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Visitors Inside</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.visitorsInside || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-[#FF9800] rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Vehicles Inside</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.vehiclesInside || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button
            onClick={() => setVisitorModalOpen(true)}
            className="h-16 bg-[#4CAF50] hover:bg-green-600 flex flex-col items-center justify-center"
          >
            <UserPlus className="h-6 w-6 mb-1" />
            <span className="text-sm">Register Visitor</span>
          </Button>
          <Button
            onClick={() => setVehicleModalOpen(true)}
            className="h-16 bg-[#FF9800] hover:bg-orange-600 flex flex-col items-center justify-center"
          >
            <Plus className="h-6 w-6 mb-1" />
            <span className="text-sm">Register Vehicle</span>
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <div className="px-4 space-y-4">
        {/* Visitors Inside */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-[#4CAF50]" />
              Visitors Inside ({stats?.visitorsInside || 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {visitorsLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : visitorsInside && visitorsInside.length > 0 ? (
              visitorsInside.map((visitor) => (
                <div key={visitor.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{visitor.name}</div>
                    <div className="text-sm text-gray-500">{visitor.idNumber}</div>
                    <div className="text-xs text-gray-400">
                      {formatTime(visitor.entryTime)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#F44336] text-white hover:bg-red-600"
                    onClick={async () => {
                      try {
                        await fetch(`/api/visitors/${visitor.id}/exit`, { method: "POST" });
                        window.location.reload();
                      } catch (error) {
                        console.error("Failed to mark exit:", error);
                      }
                    }}
                  >
                    Exit
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No visitors inside</div>
            )}
          </div>
        </Card>

        {/* Vehicles Inside */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Car className="h-5 w-5 mr-2 text-[#FF9800]" />
              Vehicles Inside ({stats?.vehiclesInside || 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {vehiclesLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : vehiclesInside && vehiclesInside.length > 0 ? (
              vehiclesInside.map((vehicle) => (
                <div key={vehicle.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                    <div className="text-sm text-gray-500">{vehicle.ownerName}</div>
                    <div className="text-xs text-gray-400">
                      {formatTime(vehicle.entryTime)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#F44336] text-white hover:bg-red-600"
                    onClick={async () => {
                      try {
                        await fetch(`/api/vehicles/${vehicle.id}/exit`, { method: "POST" });
                        window.location.reload();
                      } catch (error) {
                        console.error("Failed to mark exit:", error);
                      }
                    }}
                  >
                    Exit
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No vehicles inside</div>
            )}
          </div>
        </Card>
      </div>
    </>
  );

  const renderVisitorsTab = () => (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">All Visitors</h2>
        <Button
          onClick={() => setVisitorModalOpen(true)}
          className="bg-[#4CAF50] hover:bg-green-600"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Visitor
        </Button>
      </div>
      
      <Card>
        <div className="divide-y divide-gray-200">
          {allVisitorsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : allVisitors && allVisitors.length > 0 ? (
            allVisitors.map((visitor) => (
              <div key={visitor.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{visitor.name}</div>
                    <div className="text-sm text-gray-500">ID: {visitor.idNumber}</div>
                    <div className="text-sm text-gray-500">Phone: {visitor.phone}</div>
                    <div className="text-xs text-gray-400">
                      Entry: {formatDateTime(visitor.entryTime)}
                      {visitor.exitTime && <span> • Exit: {formatDateTime(visitor.exitTime)}</span>}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        visitor.status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {visitor.status}
                      </span>
                    </div>
                  </div>
                  {visitor.status === 'IN' && (
                    <Button
                      size="sm"
                      className="bg-[#F44336] text-white hover:bg-red-600"
                      onClick={async () => {
                        try {
                          await fetch(`/api/visitors/${visitor.id}/exit`, { method: "POST" });
                          window.location.reload();
                        } catch (error) {
                          console.error("Failed to mark exit:", error);
                        }
                      }}
                    >
                      Mark Exit
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No visitors found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderVehiclesTab = () => (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">All Vehicles</h2>
        <Button
          onClick={() => setVehicleModalOpen(true)}
          className="bg-[#FF9800] hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>
      
      <Card>
        <div className="divide-y divide-gray-200">
          {allVehiclesLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : allVehicles && allVehicles.length > 0 ? (
            allVehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{vehicle.plateNumber}</div>
                    <div className="text-sm text-gray-500">Owner: {vehicle.ownerName}</div>
                    <div className="text-sm text-gray-500">Type: {vehicle.type}</div>
                    <div className="text-sm text-gray-500">Color: {vehicle.color}</div>
                    <div className="text-xs text-gray-400">
                      Entry: {formatDateTime(vehicle.entryTime)}
                      {vehicle.exitTime && <span> • Exit: {formatDateTime(vehicle.exitTime)}</span>}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vehicle.status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                  {vehicle.status === 'IN' && (
                    <Button
                      size="sm"
                      className="bg-[#F44336] text-white hover:bg-red-600"
                      onClick={async () => {
                        try {
                          await fetch(`/api/vehicles/${vehicle.id}/exit`, { method: "POST" });
                          window.location.reload();
                        } catch (error) {
                          console.error("Failed to mark exit:", error);
                        }
                      }}
                    >
                      Mark Exit
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No vehicles found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderReportsTab = () => (
    <div className="px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Reports & Management</h2>
      
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Activity Logs</h3>
              <p className="text-sm text-gray-500">View all entry and exit activities</p>
            </div>
            <Button
              onClick={() => setLogsModalOpen(true)}
              variant="outline"
            >
              <Activity className="h-4 w-4 mr-2" />
              View Logs
            </Button>
          </div>
        </Card>

        {user?.role === 'admin' && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-500">Manage system users and permissions</p>
              </div>
              <Button
                onClick={() => setUserManagementOpen(true)}
                variant="outline"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-4">Current Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4CAF50]">{stats?.visitorsInside || 0}</div>
              <div className="text-sm text-gray-500">Visitors Inside</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FF9800]">{stats?.vehiclesInside || 0}</div>
              <div className="text-sm text-gray-500">Vehicles Inside</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1976D2] text-white shadow-lg sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-medium">Visitor Management</h1>
              <p className="text-blue-200 text-sm">Security Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-2 rounded-full bg-blue-600 hover:bg-blue-700">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-4 py-2">
          <button
            className={`flex flex-col items-center py-2 ${
              activeTab === "home" ? "text-[#1976D2]" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("home")}
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs">Home</span>
          </button>
          <button
            className={`flex flex-col items-center py-2 ${
              activeTab === "visitors" ? "text-[#1976D2]" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("visitors")}
          >
            <Users className="h-6 w-6 mb-1" />
            <span className="text-xs">Visitors</span>
          </button>
          <button
            className={`flex flex-col items-center py-2 ${
              activeTab === "vehicles" ? "text-[#1976D2]" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("vehicles")}
          >
            <Car className="h-6 w-6 mb-1" />
            <span className="text-xs">Vehicles</span>
          </button>
          <button
            className={`flex flex-col items-center py-2 ${
              activeTab === "reports" ? "text-[#1976D2]" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("reports")}
          >
            <BarChart3 className="h-6 w-6 mb-1" />
            <span className="text-xs">Reports</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <VisitorModal 
        open={visitorModalOpen} 
        onOpenChange={setVisitorModalOpen}
      />
      <VehicleModal 
        open={vehicleModalOpen} 
        onOpenChange={setVehicleModalOpen}
      />
      <LogsModal 
        open={logsModalOpen} 
        onOpenChange={setLogsModalOpen}
      />
      <UserManagementModal 
        open={userManagementOpen} 
        onOpenChange={setUserManagementOpen}
      />
    </div>
  );
}
