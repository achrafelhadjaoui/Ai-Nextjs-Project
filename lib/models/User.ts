import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  role: string;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  googleId?: string; // Google OAuth ID
  image?: string; // Profile picture URL
  bio?: string; // User biography
  phone?: string; // Phone number
  location?: string; // User location
  company?: string; // Company name
  website?: string; // Personal/company website
  timezone?: string; // User timezone
  language?: string; // Preferred language
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  extensionSettings?: {
    enableOnAllSites: boolean;
    allowedSites: string[];
    openaiApiKey?: string; // User's OpenAI API key for AI features
  };
  extensionInstalled?: boolean; // Whether extension is currently installed
  lastExtensionHeartbeat?: Date; // Last time extension pinged
  onboardingCompleted?: boolean; // Whether user completed onboarding
  onboardingData?: {
    businessType?: string;
    teamSize?: string;
    useCases?: string[];
    completedAt?: Date;
  };
  createdAt: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for OAuth users
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  googleId: { type: String }, // Google OAuth ID
  image: { type: String }, // Profile picture URL
  bio: { type: String, maxlength: 500 }, // User biography
  phone: { type: String },
  location: { type: String },
  company: { type: String },
  website: { type: String },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  extensionSettings: {
    enableOnAllSites: { type: Boolean, default: true },
    allowedSites: { type: [String], default: [] },
    openaiApiKey: { type: String, default: '' },
  },
  extensionInstalled: { type: Boolean, default: false },
  lastExtensionHeartbeat: { type: Date },
  onboardingCompleted: { type: Boolean, default: false },
  onboardingData: {
    businessType: { type: String },
    teamSize: { type: String },
    useCases: { type: [String], default: [] },
    completedAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
