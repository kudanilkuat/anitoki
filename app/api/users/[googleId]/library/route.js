import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse, getPaginationParams } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams, 20);

    const user = await User.findOne({ googleId }).select('library').lean();
    if (!user) return errorResponse('User not found', 404);

    const allLibrary = (user.library || []).sort(
      (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
    );
    const paginated = allLibrary.slice(skip, skip + limit);

    return successResponse(paginated, {
      currentPage: page,
      totalPages: Math.ceil(allLibrary.length / limit),
      totalItems: allLibrary.length,
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
    const { slug, mangaData } = await request.json();
    if (!slug) return errorResponse('slug is required', 400);

    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    const existingIndex = user.library.findIndex(item => item.slug === slug);
    if (existingIndex >= 0) {
      user.library[existingIndex].mangaData = mangaData;
      user.library[existingIndex].addedAt = Date.now();
    } else {
      if (user.library.length >= 500) {
        return errorResponse('Limit bookmark maksimal 500 komik telah tercapai. Hapus beberapa bookmark terlebih dahulu.', 400);
      }
      user.library.push({ slug, mangaData });
    }

    await user.save();
    return successResponse({ message: 'Library updated', slug });
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;
    await User.updateOne({ googleId }, { $set: { library: [] } });
    return successResponse({ message: 'Library kosong' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
