import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;
    const { bio } = await request.json();

    if (bio === undefined) return errorResponse('bio is required', 400);

    const user = await User.findOneAndUpdate(
      { googleId },
      { bio: String(bio).trim().substring(0, 100) },
      { new: true }
    ).lean();

    if (!user) return errorResponse('User not found', 404);

    return successResponse({ bio: user.bio });
  } catch (err) {
    return errorResponse(err.message);
  }
}
