import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/api-helpers';
import { createPayment } from '@/lib/wijayapay';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

const PREMIUM_PACKAGES = {
  '7days':    { days: 7,     amount: 3000,   label: 'Paket 7 Hari' },
  '30days':   { days: 30,    amount: 15000,  label: 'Paket 30 Hari' },
  // '1year':    { days: 365,   amount: 50000,  label: 'Paket 1 Tahun' },
  // 'lifetime': { days: 36500, amount: 100000, label: 'Paket Lifetime' },
};

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    const googleId = authHeader.split('Bearer ')[1];

    const body = await request.json().catch(() => ({}));
    const packageKey = body.package || '30days';
    const pkg = PREMIUM_PACKAGES[packageKey];
    if (!pkg) return errorResponse('Paket tidak valid', 400);

    // ── Ambil user dari DB dulu ────────────────────────────────────────────
    await dbConnect();
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    // Generate orderId — dipakai sebagai ref_id di WijayaPay
    const timestamp = Date.now();
    const shortId   = googleId.slice(0, 8).toUpperCase();
    const orderId   = `KRI-${shortId}-${timestamp}`;

    // ── Panggil WijayaPay API, baru simpan ke DB ──────────────────────────
    let wpData;
    try {
      wpData = await createPayment({
        ref_id:         orderId,
        amount:         pkg.amount,
        payment_method: 'QRIS',
        callback_url:   `${SITE_URL}/api/payments/webhook`,
        customer_name:  user.displayName || user.email || 'Customer',
        customer_email: user.email       || '',
      });
    } catch (wpErr) {
      console.error('[create-order] WijayaPay error:', wpErr.message);
      return errorResponse(`Gagal menghubungi payment gateway: ${wpErr.message}`, 502);
    }

    // ── Simpan order ke DB setelah WijayaPay berhasil ─────────────────────
    if (!user.pendingPremiumOrders) user.pendingPremiumOrders = [];
    user.pendingPremiumOrders.push({
      orderId,
      days:          pkg.days,
      amount:        pkg.amount,
      label:         pkg.label,
      status:        'pending',
      trx_reference: wpData.trx_reference || null,
      expiredAt:     wpData.expired ? new Date(wpData.expired) : null,
      createdAt:     new Date(),
    });
    await user.save();

    return Response.json({
      success: true,
      data: {
        orderId,
        amount:    pkg.amount,
        days:      pkg.days,
        label:     pkg.label,
        qrImage:   wpData.qr_image  || null,   // URL gambar QR dari WijayaPay
        qrString:  wpData.qr_string || null,   // raw QRIS string (fallback)
        expiredAt: wpData.expired   || null,   // "YYYY-MM-DD HH:mm:ss"
        message:   `Order berhasil dibuat. Silakan bayar ${pkg.label} via QRIS.`,
      },
    });
  } catch (err) {
    console.error('[create-order] error:', err);
    return errorResponse(err.message, 500);
  }
}
