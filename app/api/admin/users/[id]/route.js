import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Comment from '@/lib/models/Comment';

// DELETE User (Ban/Remove)
export async function DELETE(req, { params }) {
  try {
    const adminUid = req.headers.get('x-admin-uid');
    if (!adminUid) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const adminUser = await User.findOne({ googleId: adminUid, isAdmin: true });
    if (!adminUser) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const targetUserId = params.id;
    if (!targetUserId) return NextResponse.json({ success: false, message: 'Missing user ID' }, { status: 400 });

    const userToDelete = await User.findById(targetUserId);
    if (!userToDelete) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    // Hapus juga semua komentar yang pernah dibuat oleh user ini
    await Comment.deleteMany({ userId: userToDelete.googleId });

    await User.findByIdAndDelete(targetUserId);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('API Error [Admin Users DELETE]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT User (Update Premium/Admin/Coins)
export async function PUT(req, { params }) {
  try {
    const adminUid = req.headers.get('x-admin-uid');
    if (!adminUid) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const adminUser = await User.findOne({ googleId: adminUid, isAdmin: true });
    if (!adminUser) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const targetUserId = params.id;
    if (!targetUserId) return NextResponse.json({ success: false, message: 'Missing user ID' }, { status: 400 });

    const body = await req.json();

    const updateFields = {};
    if (typeof body.isAdmin !== 'undefined') updateFields.isAdmin = Boolean(body.isAdmin);
    if (typeof body.isPremium !== 'undefined') updateFields.isPremium = Boolean(body.isPremium);
    if (typeof body.coins !== 'undefined') updateFields.coins = Number(body.coins);
    if (typeof body.premiumUntil !== 'undefined') {
      updateFields.premiumUntil = body.premiumUntil ? new Date(body.premiumUntil) : null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: updateFields },
      { new: true }
    ).select('-history -library').lean();

    if (!updatedUser) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedUser, message: 'User updated' });
  } catch (error) {
    console.error('API Error [Admin Users PUT]:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
