// lib/models/AppSetting.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppSetting extends Document {
  key: string;
  value: any;
  type: "string" | "number" | "boolean" | "json" | "html" | "array";
  category: "general" | "theme" | "email" | "features" | "content" | "seo";
  label: string;
  description?: string;
  isPublic: boolean; // Whether this setting can be read by non-admin users
  updatedBy?: string; // Admin user ID who last updated
  createdAt: Date;
  updatedAt: Date;
}

const AppSettingSchema: Schema<IAppSetting> = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ["string", "number", "boolean", "json", "html", "array"],
      default: "string",
    },
    category: {
      type: String,
      enum: ["general", "theme", "email", "features", "content", "seo"],
      default: "general",
      index: true,
    },
    label: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: String,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const AppSetting: Model<IAppSetting> =
  mongoose.models.AppSetting || mongoose.model<IAppSetting>("AppSetting", AppSettingSchema);

export default AppSetting;
