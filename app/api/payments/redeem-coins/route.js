import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/api-helpers';

/**
 * POST /api/payments/redeem-coins
 *
 * User menukar 3000 koin untuk mendapatkan 7 hari premium gratis.
 * Koin langsung dikurangi dan premium langsung diaktifkan (tanpa perlu approval admin).
 *
 * Header: Authorization: Bearer <googleId>
 */

const COINS_REQUIRED = 3000;
const REWARD_DAYS    = 7;

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    const googleId = authHeader.split('Bearer ')[1];

    await dbConnect();
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User tidak ditemukan.', 404);

    const currentCoins = user.coins || 0;
    if (currentCoins < COINS_REQUIRED) {
      return errorResponse(
        `Koin tidak cukup. Kamu punya ${currentCoins} koin, dibutuhkan ${COINS_REQUIRED} koin.`,
        400
      );
    }

    // Kurangi koin & aktifkan premium
    const now      = new Date();
    const daysMs   = REWARD_DAYS * 24 * 60 * 60 * 1000;
    let newPremiumUntil;

    if (user.isPremium && user.premiumUntil && user.premiumUntil > now) {
      // Extend premium yang masih aktif
      newPremiumUntil = new Date(user.premiumUntil.getTime() + daysMs);
    } else {
      newPremiumUntil = new Date(now.getTime() + daysMs);
    }

    user.coins       = currentCoins - COINS_REQUIRED;
    user.isPremium   = true;
    user.premiumUntil = newPremiumUntil;

    if (!user.notifications) user.notifications = [];
    user.notifications.push({
      title: '🪙 Koin Berhasil Ditukar!',
      message: `${COINS_REQUIRED} koin ditukar menjadi ${REWARD_DAYS} hari premium gratis! Premium aktif hingga ${newPremiumUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Sisa koin: ${user.coins}.`,
      isRead: false,
      createdAt: new Date(),
    });

    await user.save();

    return Response.json({
      success: true,
      message: `Berhasil! ${REWARD_DAYS} hari premium diaktifkan dari ${COINS_REQUIRED} koin.`,
      data: {
        coinsUsed:      COINS_REQUIRED,
        coinsRemaining: user.coins,
        premiumUntil:   newPremiumUntil,
        daysAdded:      REWARD_DAYS,
      },
    });
  } catch (err) {
    console.error('[redeem-coins] error:', err);
    return errorResponse(err.message, 500);
  }
}
