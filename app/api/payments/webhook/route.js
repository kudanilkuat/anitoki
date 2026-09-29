import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Kirim notif Telegram ke user (opsional) */
async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (e) {
    console.warn('[webhook] Gagal kirim Telegram notif:', e.message);
  }
}

/**
 * POST /api/payments/webhook
 *
 * Dipanggil otomatis oleh WijayaPay saat pembayaran berhasil (status_pembayaran = 'paid').
 * Mengaktifkan premium user secara instan tanpa perlu konfirmasi admin.
 *
 * WijayaPay Body: { ref_id, trx_reference, status_pembayaran, ... }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ref_id, trx_reference, status_pembayaran } = body;

    console.log('[webhook] Terima callback WijayaPay:', { ref_id, trx_reference, status_pembayaran });

    // Hanya proses jika status 'paid'
    if (status_pembayaran !== 'paid') {
      return Response.json({ success: true, message: `Status '${status_pembayaran}' diabaikan.` });
    }

    if (!ref_id) {
      return Response.json({ success: false, message: 'ref_id diperlukan.' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ 'pendingPremiumOrders.orderId': ref_id });

    if (!user) {
      console.warn('[webhook] Order tidak ditemukan untuk ref_id:', ref_id);
      return Response.json({ success: false, message: 'Order tidak ditemukan.' }, { status: 404 });
    }

    const pendingIndex = user.pendingPremiumOrders.findIndex((o) => o.orderId === ref_id);
    if (pendingIndex === -1) {
      return Response.json({ success: false, message: 'Order tidak ditemukan.' }, { status: 404 });
    }

    const order = user.pendingPremiumOrders[pendingIndex];

    // Idempoten: jika sudah diproses sebelumnya, langsung return success
    if (order.status === 'paid' || order.status === 'approved') {
      console.log('[webhook] Order sudah diproses sebelumnya:', ref_id);
      return Response.json({ success: true, message: 'Order sudah diproses sebelumnya.' });
    }

    // ── Aktifkan premium ──────────────────────────────────────────────────
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

    // +20 koin loyalty
    const COINS_PER_PURCHASE = 20;
    user.coins = (user.coins || 0) + COINS_PER_PURCHASE;

    if (!user.notifications) user.notifications = [];
    user.notifications.unshift(
      {
        title:   '🎉 Premium Berhasil Diaktifkan!',
        message: `Pembayaran Rp${order.amount.toLocaleString('id-ID')} dikonfirmasi otomatis. Premium aktif hingga ${newPremiumUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
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

    await user.save();

    // ── Kirim notif Telegram ke user (jika ada telegramChatId) ────────────
    const profileUrl = `${SITE_URL}/user/${user.googleId}`;
    await sendTelegramMessage(
      order.telegramChatId,
      `🎉 *Pembayaran Dikonfirmasi Otomatis!*\n\n` +
      `✅ Order \`${ref_id}\` telah terbayar.\n` +
      `📦 Paket: *${order.label || 'Paket Premium'}*\n\n` +
      `Premium kamu sudah aktif!\n\n` +
      `👉 ${profileUrl}`
    );

    console.log('[webhook] Premium diaktifkan untuk user:', user.googleId, '| Order:', ref_id);

    return Response.json({
      success: true,
      message: `Premium berhasil diaktifkan untuk order ${ref_id}.`,
    });
  } catch (err) {
    console.error('[webhook] error:', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
