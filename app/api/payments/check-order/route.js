import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/api-helpers';
import { checkPaymentStatus } from '@/lib/wijayapay';

/**
 * POST /api/payments/check-order
 *
 * Dipanggil frontend untuk mengecek status pembayaran order.
 * Menggunakan WijayaPay get-status API — tidak lagi bergantung pada konfirmasi admin manual.
 *
 * Status dari WijayaPay: 'pending' | 'paid' | 'expired'
 */

const RATE_LIMIT_MS = 3 * 1000; // 3 detik — cukup untuk mencegah spam
const rateLimitMap = new Map();

/** Aktifkan premium user setelah pembayaran dikonfirmasi */
function buildActivationUpdate(user, order, pendingIndex) {
  const now    = new Date();
  const daysMs = order.days * 24 * 60 * 60 * 1000;

  let newPremiumUntil;
  if (user.isPremium && user.premiumUntil && user.premiumUntil > now) {
    newPremiumUntil = new Date(user.premiumUntil.getTime() + daysMs);
  } else {
    newPremiumUntil = new Date(now.getTime() + daysMs);
  }

  user.isPremium    = true;
  user.premiumUntil = newPremiumUntil;
  user.pendingPremiumOrders.splice(pendingIndex, 1);

  // +20 koin setiap aktivasi premium (sistem loyalty)
  const COINS_PER_PURCHASE = 20;
  user.coins = (user.coins || 0) + COINS_PER_PURCHASE;

  if (!user.notifications) user.notifications = [];
  user.notifications.unshift(
    {
      title:   '🎉 Premium Berhasil Diaktifkan!',
      message: `Pembayaran Rp${order.amount.toLocaleString('id-ID')} dikonfirmasi. Premium aktif hingga ${newPremiumUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      isRead:  false,
      createdAt: new Date(),
    },
    {
      title:   `🪙 +${COINS_PER_PURCHASE} Koin Diperoleh!`,
      message: `Kamu mendapat ${COINS_PER_PURCHASE} koin dari pembelian paket premium. Total koin: ${user.coins}. Kumpulkan 3.000 koin untuk tukar 7 hari premium gratis!`,
      isRead:  false,
      createdAt: new Date(),
    }
  );

  return { newPremiumUntil, days: order.days };
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    const googleId = authHeader.split('Bearer ')[1];

    // Rate limit per user
    const tsNow      = Date.now();
    const lastAttempt = rateLimitMap.get(googleId) || 0;
    const elapsed     = tsNow - lastAttempt;
    if (elapsed < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      return Response.json({
        success: false,
        approved: false,
        retryAfter: waitSec,
        message: `Coba lagi dalam ${waitSec} detik.`,
      }, { status: 429 });
    }
    rateLimitMap.set(googleId, tsNow);
    setTimeout(() => rateLimitMap.delete(googleId), RATE_LIMIT_MS * 2);

    const body = await request.json().catch(() => ({}));
    const { orderId } = body;
    if (!orderId) return errorResponse('orderId diperlukan', 400);

    await dbConnect();
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    const pendingIndex = (user.pendingPremiumOrders || []).findIndex(
      (o) => o.orderId === orderId
    );

    if (pendingIndex === -1) {
      // Order sudah dihapus (mungkin sudah diproses webhook/check sebelumnya)
      if (user.isPremium) {
        return Response.json({ success: true, approved: true });
      }
      return errorResponse('Order tidak ditemukan.', 404);
    }

    const order = user.pendingPremiumOrders[pendingIndex];

    // ── Cek status ke WijayaPay ───────────────────────────────────────────
    let wpResult;
    try {
      wpResult = await checkPaymentStatus(orderId); // orderId === ref_id
    } catch (wpErr) {
      console.error('[check-order] WijayaPay error:', wpErr.message);
      return errorResponse(`Gagal menghubungi payment gateway: ${wpErr.message}`, 502);
    }

    const statusPembayaran = wpResult?.status_pembayaran;

    // ── Belum bayar ───────────────────────────────────────────────────────
    if (statusPembayaran === 'pending') {
      return Response.json({
        success:  true,
        approved: false,
        message:  'Pembayaran belum dikonfirmasi. Tunggu beberapa menit lalu cek lagi.',
      });
    }

    // ── QR kadaluarsa ─────────────────────────────────────────────────────
    if (statusPembayaran === 'expired') {
      user.pendingPremiumOrders.splice(pendingIndex, 1);
      await user.save();
      return Response.json({
        success:  false,
        approved: false,
        expired:  true,
        message:  'QR Code sudah kadaluarsa. Silakan buat order baru.',
      }, { status: 410 });
    }

    // ── Sudah bayar (paid) → aktifkan premium ─────────────────────────────
    const { days } = buildActivationUpdate(user, order, pendingIndex);
    await user.save();

    return Response.json({
      success:  true,
      approved: true,
      message:  `Premium aktif selama ${days === 36500 ? 'seumur hidup' : days + ' hari'}!`,
    });
  } catch (err) {
    console.error('[check-order] error:', err);
    return errorResponse(err.message, 500);
  }
}
