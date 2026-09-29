import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { googleId } = params;
    await User.updateOne({ googleId }, { $set: { 'notifications.$[].isRead': true } });
    return successResponse({ message: 'All notifications marked as read' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
