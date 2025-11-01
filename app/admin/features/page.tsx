"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Wrench,
  CheckCircle,
  Lightbulb,
  Users,
  Settings,
  BarChart3,
  Loader2,
} from "lucide-react";

interface Feature {
  _id: string;
  featureKey: string;
  featureName: string;
  description?: string;
  enabled: boolean;
  maintenanceMode: boolean;
  visibleToRoles: string[];
  route?: string;
  adminRoute?: string;
  sidebarSection: "user" | "admin" | "both" | "none";
  icon?: string;
  order: number;
  isCore: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const iconMap: Record<string, any> = {
  lightbulb: Lightbulb,
  users: Users,
  settings: Settings,
  chart: BarChart3,
};

export default function FeatureManagementPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/features");
      const data = await response.json();

      if (data.success) {
        setFeatures(data.data);
        setInitialized(data.data.length > 0);
      } else {
        toast.error(data.message || "Failed to fetch features");
      }
    } catch (error: any) {
      console.error("Error fetching features:", error);
      toast.error("Failed to fetch features");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    try {
      const response = await fetch("/api/admin/features/init", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Default features initialized successfully!");
        fetchFeatures();
      } else {
        toast.error(data.message || "Failed to initialize features");
      }
    } catch (error: any) {
      console.error("Error initializing features:", error);
      toast.error("Failed to initialize features");
    }
  };

  const handleToggleEnabled = async (feature: Feature) => {
    try {
      const response = await fetch(`/api/admin/features/${feature._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !feature.enabled }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Feature ${!feature.enabled ? "enabled" : "disabled"} successfully!`
        );
        fetchFeatures();
      } else {
        toast.error(data.message || "Failed to update feature");
      }
    } catch (error: any) {
      console.error("Error updating feature:", error);
      toast.error("Failed to update feature");
    }
  };

  const handleToggleMaintenance = async (feature: Feature) => {
    try {
      const response = await fetch(`/api/admin/features/${feature._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: !feature.maintenanceMode }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Maintenance mode ${!feature.maintenanceMode ? "enabled" : "disabled"}!`
        );
        fetchFeatures();
      } else {
        toast.error(data.message || "Failed to update feature");
      }
    } catch (error: any) {
      console.error("Error updating feature:", error);
      toast.error("Failed to update feature");
    }
  };

  const handleDeleteFeature = async (feature: Feature) => {
    if (feature.isCore) {
      toast.error("Cannot delete core features. You can disable them instead.");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${feature.featureName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/features/${feature._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Feature deleted successfully!");
        fetchFeatures();
      } else {
        toast.error(data.message || "Failed to delete feature");
      }
    } catch (error: any) {
      console.error("Error deleting feature:", error);
      toast.error("Failed to delete feature");
    }
  };

  const getStatusBadge = (feature: Feature) => {
    if (!feature.enabled) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded">
          Disabled
        </span>
      );
    }
    if (feature.maintenanceMode) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded">
          Maintenance
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded">
        Active
      </span>
    );
  };

  const IconComponent = (iconName?: string) => {
    const Icon = iconName ? iconMap[iconName] : Lightbulb;
    return Icon ? <Icon className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-[#111111] rounded-lg border border-gray-800 p-8 text-center">
            <div className="mb-6">
              <Settings className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Initialize Feature Management
              </h2>
              <p className="text-gray-400">
                Set up default features to get started with feature management.
              </p>
            </div>
            <button
              onClick={handleInitialize}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Initialize Default Features
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Feature Management
          </h1>
          <p className="text-gray-400">
            Control which features are available to users and manage maintenance mode
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Features</p>
              <p className="text-2xl font-bold text-white">{features.length}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-400">
                {features.filter((f) => f.enabled && !f.maintenanceMode).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-400">
                {features.filter((f) => f.maintenanceMode).length}
              </p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Disabled</p>
              <p className="text-2xl font-bold text-red-400">
                {features.filter((f) => !f.enabled).length}
              </p>
            </div>
            <PowerOff className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Features Table */}
      <div className="bg-[#111111] rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Routes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {features.map((feature) => (
                <tr key={feature._id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">
                        {IconComponent(feature.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {feature.featureName}
                          </p>
                          {feature.isCore && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                              Core
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {feature.description || feature.featureKey}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(feature)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {feature.visibleToRoles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 text-xs font-medium bg-gray-700/50 text-gray-300 rounded"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-400">
                      {feature.route && (
                        <div className="mb-1">
                          <span className="font-medium">User:</span> {feature.route}
                        </div>
                      )}
                      {feature.adminRoute && (
                        <div>
                          <span className="font-medium">Admin:</span>{" "}
                          {feature.adminRoute}
                        </div>
                      )}
                      {!feature.route && !feature.adminRoute && (
                        <span className="text-gray-600">No routes</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleEnabled(feature)}
                        className={`p-2 rounded-lg transition-colors ${
                          feature.enabled
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                        }`}
                        title={feature.enabled ? "Disable" : "Enable"}
                      >
                        {feature.enabled ? (
                          <Power className="w-4 h-4" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleMaintenance(feature)}
                        className={`p-2 rounded-lg transition-colors ${
                          feature.maintenanceMode
                            ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                            : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                        }`}
                        title="Toggle Maintenance"
                        disabled={!feature.enabled}
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                      {!feature.isCore && (
                        <button
                          onClick={() => handleDeleteFeature(feature)}
                          className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
