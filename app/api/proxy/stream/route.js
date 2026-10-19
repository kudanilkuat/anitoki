import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/proxy/stream?url=https://desustream.net/...
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const streamUrl = searchParams.get('url');

    if (!streamUrl) {
        return new NextResponse('Parameter url diperlukan', { status: 400 });
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(streamUrl);
    } catch {
        return new NextResponse('URL tidak valid', { status: 400 });
    }

    try {
        const response = await fetch(streamUrl, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://otakudesu.blog/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            },
        });

        if (!response.ok) {
            return new NextResponse(`Gagal mengambil stream: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'text/html; charset=utf-8';
        let html = await response.text();

        // Inject <base> tag jika belum ada agar relative script/style/asset resolve ke origin asli
        if (contentType.includes('text/html') && !html.includes('<base ')) {
            const baseTag = `<base href="${parsedUrl.origin}${parsedUrl.pathname}">`;
            if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>${baseTag}`);
            } else if (html.includes('<html>')) {
                html = html.replace('<html>', `<html><head>${baseTag}</head>`);
            } else {
                html = `${baseTag}${html}`;
            }
        }

        return new NextResponse(html, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Frame-Options': 'ALLOWALL',
                // Beri izin embed di iframe tanpa terblokir frame-ancestors
                'Content-Security-Policy': "frame-ancestors 'self' *",
            },
        });
    } catch (err) {
        console.error('[stream-proxy] Error:', err.message);
        return new NextResponse('Gagal memuat stream video', { status: 502 });
    }
}
