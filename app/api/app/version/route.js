import { NextResponse } from 'next/server';

/**
 * GET /api/app/version
 * Mengembalikan konfigurasi versi terbaru aplikasi.
 * Edit field di bawah setiap kali ada update versi baru.
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            latestVersion: '1.0.0',
            latestBuildNumber: 1,
            forceUpdate: false,
            updateUrl: 'https://anitoki.id/download',
            message: 'Versi baru Anitoki tersedia! Update sekarang untuk mendapatkan fitur terbaru dan perbaikan bug.',
            title: 'Update Tersedia 🎉',
            whatsNew: [
                'Browse & filter anime by genre, type, status',
                'Server & download list di halaman episode',
                'Navigasi prev/next episode',
            ],
        },
    });
}
