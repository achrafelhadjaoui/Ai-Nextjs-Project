// import mongoose, { Schema, Document, models } from "mongoose";

// export interface IUser extends Document {
//   name: string;
//   email: string;
//   password: string;
//   createdAt: Date;
// }

// const UserSchema = new Schema<IUser>({
//   name: {
//     type: String,
//     required: [true, "Name is required"],
//   },
//   email: {
//     type: String,
//     required: [true, "Email is required"],
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: [true, "Password is required"],
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// export default models.User || mongoose.model<IUser>("User", UserSchema);




// import mongoose, { Schema, Document } from "mongoose";

// export interface IUser extends Document {
//   name: string;
//   email: string;
//   password: string;
//   resetToken?: string;
//   resetTokenExpiry?: Date;
//   createdAt: Date;
  
// }

// const UserSchema = new Schema<IUser>({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   resetToken: { type: String },
//   resetTokenExpiry: { type: Date },
//   createdAt: {
//         type: Date,
//         default: Date.now,
//       },
// });

// export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);






// import mongoose, { Schema, Document } from "mongoose";

// export interface IUser extends Document {
//   name: string;
//   email: string;
//   password: string;
//   isVerified: boolean;
//   verificationToken?: string;
//   resetToken?: string;
//   resetTokenExpiry?: Date;
//   createdAt: Date;
// }

// const UserSchema = new Schema<IUser>({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   isVerified: { type: Boolean, default: false },
//   verificationToken: { type: String },
//   resetToken: { type: String },
//   resetTokenExpiry: { type: Date },
//   createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);








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
  createdAt: Date;
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
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);