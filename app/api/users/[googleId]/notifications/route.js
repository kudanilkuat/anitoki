import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;

    const user = await User.findOne({ googleId }).select('notifications');
    if (!user) return errorResponse('User not found', 404);

    const now = new Date();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    let hasChanged = false;

    const validNotifications = (user.notifications || []).filter(notif => {
      const diff = now.getTime() - new Date(notif.createdAt).getTime();
      if (diff > ONE_DAY_MS) {
        hasChanged = true;
        return false;
      }
      return true;
    });

    if (hasChanged) {
      user.notifications = validNotifications;
      await user.save();
    }

    const sorted = validNotifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return successResponse(sorted);
  } catch (err) {
    return errorResponse(err.message);
  }
}
