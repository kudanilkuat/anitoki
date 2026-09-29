import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/lib/models/Comment';
import User from '@/lib/models/User';

export async function GET(req) {
  try {
    const adminUid = req.headers.get('x-admin-uid');
    if (!adminUid) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const adminUser = await User.findOne({ googleId: adminUid, isAdmin: true });
    if (!adminUser) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('q') || '';

    const query = {};
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const totalItems = await Comment.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: { currentPage: page, totalPages, totalItems, limit }
    });
  } catch (error) {
    console.error('API Error [Admin Comments GET]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
