import mongoose, { Schema, Document } from "mongoose";

export interface IFeatureRequest extends Document {
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  votes: number;
  votedBy: mongoose.Types.ObjectId[]; // Array of user IDs who voted
  userId: mongoose.Types.ObjectId; // User who created the request
  userName: string; // Cache the user's name for faster display
  userEmail: string; // Cache the user's email
  adminResponse?: string; // Optional admin response/notes
  createdAt: Date;
  updatedAt: Date;
}

const FeatureRequestSchema = new Schema<IFeatureRequest>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [5, "Title must be at least 5 characters"],
    maxlength: [200, "Title must not exceed 200 characters"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    minlength: [10, "Description must be at least 10 characters"],
    maxlength: [2000, "Description must not exceed 2000 characters"]
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },
  votes: {
    type: Number,
    default: 0
  },
  votedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  adminResponse: {
    type: String
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

// Update the updatedAt timestamp on save
FeatureRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.FeatureRequest ||
  mongoose.model<IFeatureRequest>("FeatureRequest", FeatureRequestSchema);
