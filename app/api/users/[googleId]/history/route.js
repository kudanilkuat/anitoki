import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, getPaginationParams } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams, 20);

    const user = await User.findOne({ googleId }).select('history').lean();
    if (!user) return errorResponse('User not found', 404);

    const seen = new Map();
    for (const item of user.history || []) {
      const existing = seen.get(item.slug);
      if (!existing) {
        seen.set(item.slug, item);
      } else {
        const t1 = existing.lastRead ? new Date(existing.lastRead).getTime() : 0;
        const t2 = item.lastRead ? new Date(item.lastRead).getTime() : 0;
        if (t2 > t1) seen.set(item.slug, item);
      }
    }

    const allHistory = [...seen.values()].sort(
      (a, b) => new Date(b.lastRead) - new Date(a.lastRead)
    );
    const paginated = allHistory.slice(skip, skip + limit);

    return successResponse(paginated, {
      currentPage: page,
      totalPages: Math.ceil(allHistory.length / limit),
      totalItems: allHistory.length,
      perPage: limit,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;
    const { type, slug, title, thumb, lastChapterTitle, lastChapterSlug } = await request.json();
    if (!slug) return errorResponse('slug is required', 400);

    const now = new Date();

    const updateExisting = await User.updateOne(
      { googleId, 'history.slug': slug },
      {
        $set: {
          'history.$.lastChapterTitle': lastChapterTitle,
          'history.$.lastChapterSlug': lastChapterSlug,
          'history.$.lastRead': now,
          ...(title && { 'history.$.title': title }),
          ...(thumb && { 'history.$.thumb': thumb }),
        },
      }
    );

    if (updateExisting.modifiedCount === 0) {
      await User.updateOne(
        { googleId, 'history.slug': { $ne: slug } },
        {
          $push: {
            history: { type, slug, title, thumb, lastChapterTitle, lastChapterSlug, lastRead: now },
          },
        }
      );
    }

    return successResponse({ message: 'History updated', slug });
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const type = searchParams.get('type');

    if (slug) {
      // Hapus satu item berdasarkan slug
      await User.updateOne({ googleId }, { $pull: { history: { slug } } });
      return successResponse({ message: 'Riwayat dihapus', slug });
    } else if (type) {
      await User.updateOne({ googleId }, { $pull: { history: { type } } });
    } else {
      await User.updateOne({ googleId }, { $set: { history: [] } });
    }

    return successResponse({ message: 'Riwayat bersih' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
