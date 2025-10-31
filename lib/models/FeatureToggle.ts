import mongoose, { Schema, Document } from "mongoose";

export interface IFeatureToggle extends Document {
  featureKey: string; // Unique identifier (e.g., "feature-requests", "blog", "analytics")
  featureName: string; // Display name (e.g., "Feature Requests", "Blog System")
  description?: string; // What this feature does
  enabled: boolean; // Is the feature active?
  maintenanceMode: boolean; // Is the feature in maintenance?
  visibleToRoles: ("admin" | "user")[]; // Which roles can see this feature
  route?: string; // Main route for this feature (e.g., "/feature-requests")
  adminRoute?: string; // Admin management route (e.g., "/admin/feature-requests")
  sidebarSection: "user" | "admin" | "both" | "none"; // Where to show in sidebar
  icon?: string; // Icon name for sidebar
  order: number; // Display order in lists/sidebars
  isCore: boolean; // Core features can't be deleted (only toggled)
  metadata?: Record<string, any>; // Additional feature-specific data
  updatedBy?: string; // Admin who last updated this
  createdAt: Date;
  updatedAt: Date;
}

const FeatureToggleSchema = new Schema<IFeatureToggle>(
  {
    featureKey: {
      type: String,
      required: [true, "Feature key is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Feature key must contain only lowercase letters, numbers, and hyphens"],
    },
    featureName: {
      type: String,
      required: [true, "Feature name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    visibleToRoles: {
      type: [String],
      enum: ["admin", "user"],
      default: ["admin", "user"],
    },
    route: {
      type: String,
      trim: true,
    },
    adminRoute: {
      type: String,
      trim: true,
    },
    sidebarSection: {
      type: String,
      enum: ["user", "admin", "both", "none"],
      default: "both",
    },
    icon: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isCore: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
FeatureToggleSchema.index({ featureKey: 1 });
FeatureToggleSchema.index({ enabled: 1, maintenanceMode: 1 });

export default mongoose.models.FeatureToggle ||
  mongoose.model<IFeatureToggle>("FeatureToggle", FeatureToggleSchema);
