import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = data;

    if (!id || !hash || !auth_date) {
      return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Verify Telegram data
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ success: false, error: 'Telegram bot not configured' }, { status: 500 });
    }

    // Check if auth_date is not too old (max 1 day)
    const now = Math.floor(Date.now() / 1000);
    if (now - auth_date > 86400) {
      return NextResponse.json({ success: false, error: 'Login data expired' }, { status: 400 });
    }

    // Verify hash
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const checkData = Object.keys(data)
      .filter(k => k !== 'hash')
      .sort()
      .map(k => `${k}=${data[k]}`)
      .join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(checkData).digest('hex');

    if (hmac !== hash) {
      return NextResponse.json({ success: false, error: 'Invalid Telegram data' }, { status: 403 });
    }

    // Create or get Firebase user
    const telegramUid = `telegram_${id}`;
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || username || `User ${id}`;

    // Ambil auth instance (baru dipanggil saat runtime)
    const adminAuth = getAdminAuth();

    try {
      await adminAuth.getUser(telegramUid);
      // User exists, update profile
      await adminAuth.updateUser(telegramUid, {
        displayName,
        ...(photo_url ? { photoURL: photo_url } : {}),
      });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Create new user
        await adminAuth.createUser({
          uid: telegramUid,
          displayName,
          ...(photo_url ? { photoURL: photo_url } : {}),
        });
      } else {
        throw err;
      }
    }

    // Create custom token
    const token = await adminAuth.createCustomToken(telegramUid);

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
