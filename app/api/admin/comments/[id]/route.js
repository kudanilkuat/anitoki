import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/lib/models/Comment';
import User from '@/lib/models/User';

export async function DELETE(req, { params }) {
  try {
    const adminUid = req.headers.get('x-admin-uid');
    if (!adminUid) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const adminUser = await User.findOne({ googleId: adminUid, isAdmin: true });
    if (!adminUser) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const commentId = params.id;
    if (!commentId) return NextResponse.json({ success: false, message: 'Missing comment ID' }, { status: 400 });

    const commentToDelete = await Comment.findById(commentId);
    if (!commentToDelete) return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });

    await Comment.findByIdAndDelete(commentId);

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('API Error [Admin Comments DELETE]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const adminUid = req.headers.get('x-admin-uid');
    if (!adminUid) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const adminUser = await User.findOne({ googleId: adminUid, isAdmin: true });
    if (!adminUser) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const commentId = params.id;
    if (!commentId) return NextResponse.json({ success: false, message: 'Missing comment ID' }, { status: 400 });

    const body = await req.json();
    const { status } = body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Status tidak valid (harus pending, approved, atau rejected)' }, { status: 400 });
    }

    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Komentar berhasil diubah status menjadi ${status}`,
      data: updated
    });
  } catch (error) {
    console.error('API Error [Admin Comments PATCH]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

