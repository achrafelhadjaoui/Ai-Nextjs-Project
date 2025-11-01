import mongoose, { Schema, Document } from "mongoose";

export interface ISavedReply extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category?: string;
  keywords?: string[];
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedReplySchema = new Schema<ISavedReply>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
SavedReplySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
SavedReplySchema.index({ userId: 1, createdAt: -1 });
SavedReplySchema.index({ userId: 1, category: 1 });
SavedReplySchema.index({ userId: 1, title: 'text', content: 'text' });

export default mongoose.models.SavedReply || mongoose.model<ISavedReply>("SavedReply", SavedReplySchema);
