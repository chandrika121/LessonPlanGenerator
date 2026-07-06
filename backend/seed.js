// Seed script for creating initial users
// Run with: node backend/seed.js

import mongoose from "mongoose";
import { UserModel } from "./models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kamalaniketan-lms";

const SEED_USERS = [
  {
    name: "Principal Admin",
    email: "principal@kamalaniketan.com",
    password: "principal123",
    role: "principal",
    phone: "9876543210",
    schoolId: "kamala-niketan",
    status: "active",
  },
  {
    name: "Teacher",
    email: "teacher@kamalaniketan.com",
    password: "teacher123",
    role: "teacher",
    phone: "9876543211",
    schoolId: "kamala-niketan",
    subjects: ["Mathematics"],
    status: "active",
  },
  {
    name: "Student",
    email: "student@kamalaniketan.com",
    password: "student123",
    role: "student",
    phone: "9876543212",
    schoolId: "kamala-niketan",
    classId: "X",
    section: "A",
    status: "active",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    for (const userData of SEED_USERS) {
      const existing = await UserModel.findOne({ email: userData.email });
      if (existing) {
        console.log(`User already exists: ${userData.email}`);
      } else {
        await UserModel.create(userData);
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log("\nSeed complete! Available accounts:");
    console.log("  Principal: principal@kamalaniketan.com / principal123");
    console.log("  Teacher:   teacher@kamalaniketan.com / teacher123");
    console.log("  Student:   student@kamalaniketan.com / student123");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();