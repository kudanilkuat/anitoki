import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;
    const { displayName, photoURL, bio } = await request.json();

    if (!displayName && !photoURL && bio === undefined) {
      return errorResponse('Minimal satu field harus diisi', 400);
    }

    const updates = {};

    if (displayName !== undefined) {
      const trimmed = String(displayName).trim();
      if (trimmed.length < 2) return errorResponse('Nama minimal 2 karakter', 400);
      if (trimmed.length > 50) return errorResponse('Nama maksimal 50 karakter', 400);
      updates.displayName = trimmed;
    }
    if (photoURL !== undefined) {
      updates.photoURL = String(photoURL).trim();
    }
    if (bio !== undefined) {
      updates.bio = String(bio).trim().substring(0, 100);
    }

    const user = await User.findOneAndUpdate(
      { googleId },
      { $set: updates },
      { new: true }
    )
      .select('googleId displayName photoURL bio')
      .lean();

    if (!user) return errorResponse('User not found', 404);

    return successResponse(user);
  } catch (err) {
    return errorResponse(err.message);
  }
}
