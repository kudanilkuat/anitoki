import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

const MAX_DAILY_LIMIT = 5;

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;

    const user = await User.findOne({ googleId }).select(
      'isAdmin isPremium premiumUntil dailyDownloads downloadCount'
    );
    if (!user) return errorResponse('User not found', 404);

    if (!user.isAdmin && user.isPremium && user.premiumUntil) {
      if (new Date() > user.premiumUntil) {
        user.isPremium = false;
        user.premiumUntil = null;
        await user.save();
      }
    }

    if (user.isPremium || user.isAdmin) {
      return successResponse({ allowed: true, isPremium: true });
    }

    const today = new Date().toISOString().split('T')[0];

    if (!user.dailyDownloads?.date || user.dailyDownloads.date !== today) {
      user.dailyDownloads = { date: today, count: 0 };
    }

    if (user.dailyDownloads.count >= MAX_DAILY_LIMIT) {
      return successResponse({ allowed: false, reason: 'limit_reached' });
    }

    user.dailyDownloads.count += 1;
    user.downloadCount = (user.downloadCount || 0) + 1;
    await user.save();

    return successResponse({
      allowed: true,
      remaining: MAX_DAILY_LIMIT - user.dailyDownloads.count,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
