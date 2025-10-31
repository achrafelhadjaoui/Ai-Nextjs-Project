// lib/models/Media.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMedia extends Document {
  filename: string; // Original filename
  storedFilename: string; // Filename on server (with timestamp)
  mimetype: string; // image/png, image/jpeg, etc.
  size: number; // File size in bytes
  url: string; // Public URL to access the file
  path: string; // Server path
  folder?: string; // Organize into folders (e.g., 'logos', 'blog', 'user-avatars')
  alt?: string; // Alt text for images
  title?: string; // Display title
  description?: string; // File description
  uploadedBy: string; // User ID who uploaded
  width?: number; // Image width (for images)
  height?: number; // Image height (for images)
  usedIn?: string[]; // Array of setting keys or page IDs where this media is used
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema: Schema<IMedia> = new Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    storedFilename: {
      type: String,
      required: true,
      unique: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    folder: {
      type: String,
      default: 'general',
      index: true,
    },
    alt: {
      type: String,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    uploadedBy: {
      type: String,
      ref: 'User',
      required: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    usedIn: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
MediaSchema.index({ folder: 1, createdAt: -1 });
MediaSchema.index({ mimetype: 1 });
MediaSchema.index({ uploadedBy: 1 });

const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);

export default Media;
