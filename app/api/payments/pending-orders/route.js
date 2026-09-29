import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/api-helpers';

/**
 * GET /api/payments/pending-orders
 * Mengambil daftar pending orders milik user yang sedang login.
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    const googleId = authHeader.split('Bearer ')[1];

    await dbConnect();
    const user = await User.findOne({ googleId }).select('pendingPremiumOrders coins').lean();
    if (!user) return errorResponse('User not found', 404);

    const orders = (user.pendingPremiumOrders || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return Response.json({ success: true, data: orders, coins: user.coins || 0 });
  } catch (err) {
    console.error('[pending-orders] error:', err);
    return errorResponse(err.message, 500);
  }
}
