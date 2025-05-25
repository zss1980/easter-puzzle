import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// To configure the MongoDB connection, set the MONGODB_URI environment variable.
// For local development, you can create a .env file in the apps/backend directory:
//
// .env file contents:
// MONGODB_URI=mongodb://localhost:27017/egghunt_db
// BACKEND_PORT=3001
//
// Ensure this .env file is listed in the root .gitignore file.
// For production, set this environment variable in your deployment environment.

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error('MongoDB URI is not defined. Skipping connection attempt.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected.');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error event:', error);
});

export default connectDB;
