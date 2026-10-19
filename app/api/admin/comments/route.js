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
    const statusFilter = searchParams.get('status') || 'all';

    const filterConditions = [];

    if (search) {
      filterConditions.push({
        $or: [
          { text: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } },
        ]
      });
    }

    if (statusFilter === 'pending') {
      filterConditions.push({ status: 'pending' });
    } else if (statusFilter === 'approved') {
      filterConditions.push({
        $or: [{ status: 'approved' }, { status: { $exists: false } }]
      });
    } else if (statusFilter === 'rejected') {
      filterConditions.push({ status: 'rejected' });
    }

    const query = filterConditions.length > 0 ? { $and: filterConditions } : {};

    const [totalItems, comments, pendingCount, approvedCount, rejectedCount, allCount] = await Promise.all([
      Comment.countDocuments(query),
      Comment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ status: 'pending' }),
      Comment.countDocuments({ $or: [{ status: 'approved' }, { status: { $exists: false } }] }),
      Comment.countDocuments({ status: 'rejected' }),
      Comment.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      success: true,
      data: comments,
      counts: {
        all: allCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      pagination: { currentPage: page, totalPages, totalItems, limit }
    });
  } catch (error) {
    console.error('API Error [Admin Comments GET]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
