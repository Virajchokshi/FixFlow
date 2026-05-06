import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { Technician } from '../models/Technician.model';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const BCRYPT_ROUNDS = 12;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  // 'none' required when frontend and backend are on different origins (cross-site cookies)
  sameSite: (env.nodeEnv === 'production' ? 'none' : 'strict') as 'none' | 'strict',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role, phone, department, specialization } = req.body as {
      name: string;
      email: string;
      password: string;
      role: string;
      phone?: string;
      department?: string;
      specialization?: string;
    };

    const existing = await User.findOne({ email });
    if (existing) throw ApiError.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ name, email, passwordHash, role, phone, department });

    // Auto-create Technician profile for technician role
    if (role === 'technician') {
      await Technician.create({
        userId: user._id,
        specialization: specialization?.trim() || 'General',
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role, name: user.name },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as unknown as number }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email });
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Invalid email or password');

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role, name: user.name },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as unknown as number }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        department: user.department,
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) throw ApiError.notFound('User not found');

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ success: true, message: 'Logged out successfully' });
}
