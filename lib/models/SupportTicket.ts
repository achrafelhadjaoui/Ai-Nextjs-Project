import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicket extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: "technical" | "billing" | "feature-request" | "bug-report" | "general" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "waiting-response" | "resolved" | "closed";
  attachments?: string[]; // URLs to uploaded files
  adminResponse?: string;
  adminNotes?: string; // Internal notes not visible to user
  respondedBy?: string; // Admin user ID who responded
  respondedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  tags?: string[]; // For categorization
  rating?: number; // User satisfaction rating (1-5) after resolution
  feedback?: string; // User feedback after resolution
  conversationHistory?: {
    message: string;
    sender: "user" | "admin";
    senderName: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    userName: {
      type: String,
      required: [true, "User name is required"],
    },
    userEmail: {
      type: String,
      required: [true, "User email is required"],
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    category: {
      type: String,
      enum: ["technical", "billing", "feature-request", "bug-report", "general", "other"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "waiting-response", "resolved", "closed"],
      default: "open",
      index: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    adminResponse: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    respondedBy: {
      type: String,
    },
    respondedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
    },
    conversationHistory: {
      type: [
        {
          message: String,
          sender: {
            type: String,
            enum: ["user", "admin"],
          },
          senderName: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
SupportTicketSchema.index({ userId: 1, status: 1 });
SupportTicketSchema.index({ userEmail: 1 });
SupportTicketSchema.index({ category: 1, status: 1 });
SupportTicketSchema.index({ priority: 1, status: 1 });
SupportTicketSchema.index({ createdAt: -1 });

export default mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);
