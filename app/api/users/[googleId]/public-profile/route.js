import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;

    const user = await User.findOne({ googleId })
      .select('googleId displayName photoURL bio library isPremium isAdmin totalReadingMinutes')
      .lean();

    if (!user) return errorResponse('User not found', 404);

    const library = user.library || [];
    const stats = library.reduce((acc, item) => {
      const status = item.mangaData?.readingStatus || 'reading';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return successResponse({
      googleId: user.googleId,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      bio: user.bio || '',
      isPremium: user.isPremium || false,
      isAdmin: user.isAdmin || false,
      library,
      stats: {
        reading: stats.reading || 0,
        to_read: stats.to_read || 0,
        finished: stats.finished || 0,
        dropped: stats.dropped || 0,
        total: library.length,
        totalReadingMinutes: user.totalReadingMinutes || 0,
      },
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
