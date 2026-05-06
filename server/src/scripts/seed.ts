import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { Technician } from '../models/Technician.model';
import { SLAPolicy } from '../models/SLAPolicy.model';

const SEED_EMAILS = [
  'admin@fixflow.com',
  'tech@fixflow.com',
  'user@fixflow.com',
];

const seed = async (): Promise<void> => {
  const uri = process.env['MONGODB_URI'];
  if (!uri) throw new Error('MONGODB_URI not set in environment');

  await mongoose.connect(uri, { dbName: 'fixflow' });
  console.log('🔌 Connected to MongoDB for seeding...\n');

  // Clear existing seed data so script is idempotent
  const existingUsers = await User.find({ email: { $in: SEED_EMAILS } });
  const existingUserIds = existingUsers.map((u) => u._id);
  await Technician.deleteMany({ userId: { $in: existingUserIds } });
  await User.deleteMany({ email: { $in: SEED_EMAILS } });
  await SLAPolicy.deleteMany({});

  // All seed users share the same dev password
  const passwordHash = await bcrypt.hash('FixFlow@2025', 12);

  // Create users one at a time so we have the admin _id for SLA policies
  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@fixflow.com',
    passwordHash,
    role: 'admin',
    isActive: true,
    department: 'Operations',
  });

  const technician = await User.create({
    name: 'Tom Technician',
    email: 'tech@fixflow.com',
    passwordHash,
    role: 'technician',
    isActive: true,
    department: 'Maintenance',
  });

  await User.create({
    name: 'Uma User',
    email: 'user@fixflow.com',
    passwordHash,
    role: 'user',
    isActive: true,
    department: 'Facilities',
  });

  // Technician profile — required for ticket assignment
  await Technician.create({
    userId: technician._id,
    specialization: 'General Maintenance',
    availability: 'available',
    currentWorkload: 0,
  });

  // SLA policies — one per priority (priority is unique in schema)
  await SLAPolicy.insertMany([
    {
      priority: 'critical',
      responseTimeHours: 1,
      resolutionTimeHours: 4,
      createdBy: admin._id,
    },
    {
      priority: 'high',
      responseTimeHours: 4,
      resolutionTimeHours: 24,
      createdBy: admin._id,
    },
    {
      priority: 'medium',
      responseTimeHours: 8,
      resolutionTimeHours: 72,
      createdBy: admin._id,
    },
    {
      priority: 'low',
      responseTimeHours: 24,
      resolutionTimeHours: 168,
      createdBy: admin._id,
    },
  ]);

  console.log('✅ Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('Role       Email                  Password');
  console.log('─────────────────────────────────────────');
  console.log('Admin      admin@fixflow.com      FixFlow@2025');
  console.log('Technician tech@fixflow.com       FixFlow@2025');
  console.log('User       user@fixflow.com       FixFlow@2025');
  console.log('─────────────────────────────────────────\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Seed failed:', message);
  process.exit(1);
});
