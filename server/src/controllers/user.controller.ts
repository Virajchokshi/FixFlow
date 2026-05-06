import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User.model';
import { Technician } from '../models/Technician.model';
import { ApiError } from '../utils/ApiError';

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-passwordHash').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      data: users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params['id']).select('-passwordHash');
    if (!user) throw ApiError.notFound('User not found');

    let techProfile = null;
    if (user.role === 'technician') {
      techProfile = await Technician.findOne({ userId: user._id });
    }

    res.json({ success: true, data: { ...user.toObject(), techProfile } });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, phone, department, specialization, availability } = req.body as {
      name?: string;
      phone?: string;
      department?: string;
      specialization?: string;
      availability?: string;
    };

    const user = await User.findByIdAndUpdate(
      req.params['id'],
      { name, phone, department },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) throw ApiError.notFound('User not found');

    if (user.role === 'technician' && (specialization || availability)) {
      await Technician.findOneAndUpdate(
        { userId: user._id },
        { specialization, availability },
        { new: true }
      );
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = req.body as { role: UserRole };

    const user = await User.findByIdAndUpdate(
      req.params['id'],
      { role },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) throw ApiError.notFound('User not found');

    if (role === 'technician') {
      const existingTech = await Technician.findOne({ userId: user._id });
      if (!existingTech) {
        await Technician.create({ userId: user._id, specialization: 'General' });
      }
    }

    res.json({ success: true, data: user, message: 'Role updated' });
  } catch (error) {
    next(error);
  }
}

export async function deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params['id'] === req.user!.userId) {
      throw ApiError.badRequest('Cannot deactivate your own account');
    }

    const user = await User.findByIdAndUpdate(
      req.params['id'],
      { isActive: false },
      { new: true }
    ).select('-passwordHash');

    if (!user) throw ApiError.notFound('User not found');

    res.json({ success: true, data: user, message: 'User deactivated' });
  } catch (error) {
    next(error);
  }
}

export async function activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findByIdAndUpdate(
      req.params['id'],
      { isActive: true },
      { new: true }
    ).select('-passwordHash');

    if (!user) throw ApiError.notFound('User not found');

    res.json({ success: true, data: user, message: 'User activated' });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role: UserRole;
    };

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('A user with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });

    if (role === 'technician') {
      await Technician.create({ userId: user._id, specialization: 'General' });
    }

    const { passwordHash: _, ...userObj } = user.toObject();
    res.status(201).json({ success: true, data: userObj, message: 'User created' });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params['id'] === req.user!.userId) {
      throw ApiError.badRequest('Cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(req.params['id']);
    if (!user) throw ApiError.notFound('User not found');

    // Clean up technician profile if present
    await Technician.findOneAndDelete({ userId: user._id });

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
}

export async function listTechnicians(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category } = req.query as { category?: string };

    if (category) {
      const technicians = await Technician.find({
        $or: [
          { specialization: new RegExp(`^${category}$`, 'i') },
          { specialization: /^general$/i },
        ],
      })
        .populate('userId', '-passwordHash')
        .sort({ currentWorkload: 1 });

      res.json({ success: true, data: technicians });
      return;
    }

    const technicians = await Technician.find()
      .populate('userId', '-passwordHash')
      .sort({ currentWorkload: 1 });

    res.json({ success: true, data: technicians });
  } catch (error) {
    next(error);
  }
}
