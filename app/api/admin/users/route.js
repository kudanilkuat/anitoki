import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
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
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-history -library') // Exclude heavy array fields
      .lean();

    return NextResponse.json({
      success: true,
      data: users,
      pagination: { currentPage: page, totalPages, totalItems, limit }
    });
  } catch (error) {
    console.error('API Error [Admin Users GET]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
