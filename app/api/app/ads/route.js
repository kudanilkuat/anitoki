import { NextResponse } from 'next/server';

/**
 * GET /api/app/ads
 * Konfigurasi iklan untuk user gratis / belum login.
 * Edit field di bawah untuk mengatur iklan.
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            // true = iklan aktif, false = nonaktifkan semua iklan
            enabled: true,
            // URL iklan yang dibuka di browser
            adUrl: 'https://asupanbocil.cfd/',
            // Jeda antar iklan dalam detik (300 = 5 menit)
            intervalSeconds: 300,
            // Delay sebelum iklan pertama muncul setelah buka chapter (detik)
            initialDelaySeconds: 3,
            // Tampilkan iklan untuk: 'all' = semua, 'guest' = hanya belum login, 'free' = login tapi belum premium
            showFor: 'all', // 'all' | 'guest' | 'free'
        },
    });
}
