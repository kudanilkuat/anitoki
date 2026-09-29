import { NextResponse } from 'next/server';

// Matikan semua caching Next.js — cegah gambar masuk .next/cache/fetch-cache & disk VPS membengkak
export const dynamic    = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/img-proxy?url=https://img.komiku.org/...
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('url parameter diperlukan', { status: 400 });
    }

    // Validasi URL — hanya izinkan domain sumber gambar manga
    let parsedUrl;
    try {
        parsedUrl = new URL(imageUrl);
    } catch {
        return new NextResponse('URL tidak valid', { status: 400 });
    }

    const allowedHosts = [
        'img.komiku.org',
        'img.komiku.id',
        'komiku.org',
        'cdn.komiku.org',
        'komikcast.id',
        'cdn.komikcast.id',
        'i.ibb.co',
        'cdn.statically.io',
    ];
    const isAllowed = allowedHosts.some(
        host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
    );
    if (!isAllowed) {
        return new NextResponse('Domain tidak diizinkan', { status: 403 });
    }

    try {
        const response = await fetch(imageUrl, {
            // no-store: cegah fetch result masuk ke .next/cache/fetch-cache di disk VPS
            cache: 'no-store',
            headers: {
                'Referer': parsedUrl.origin,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            return new NextResponse(`Gagal fetch gambar: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                // no-store: browser & CDN/proxy TIDAK boleh cache response ini
                // Mencegah storage VPS membengkak akibat akumulasi cache gambar
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
                'X-Proxied': 'true',
            },
        });
    } catch (err) {
        console.error('[img-proxy] Error:', err.message);
        return new NextResponse('Gagal mengambil gambar', { status: 502 });
    }
}
