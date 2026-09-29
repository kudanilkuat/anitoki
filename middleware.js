import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Redirect episode URLs with leading zeros (episode-03 -> episode-3)
  const episodeMatch = pathname.match(/^\/episode\/([^/]+)\/episode-0+(\d+)\/?$/);
  if (episodeMatch) {
    const animeSlug = episodeMatch[1];
    const episodeNum = episodeMatch[2];
    return NextResponse.redirect(
      new URL(`/episode/${animeSlug}/episode-${episodeNum}`, request.url),
      { status: 301 }
    );
  }

  // Redirect /type/:type/page/:page/ dan /type/:type/
  const typePageMatch = pathname.match(/^\/type\/([^/]+)\/page\/(\d+)\/?$/);
  const typeMatch = pathname.match(/^\/type\/([^/]+)\/?$/);

  if (typePageMatch) {
    const type = typePageMatch[1].charAt(0).toUpperCase() + typePageMatch[1].slice(1);
    const page = typePageMatch[2];
    return NextResponse.redirect(
      new URL(`/anime?type=${type}&page=${page}`, request.url),
      { status: 301 }
    );
  }

  if (typeMatch) {
    const type = typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1);
    return NextResponse.redirect(
      new URL(`/anime?type=${type}`, request.url),
      { status: 301 }
    );
  }

  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (origin && !origin.startsWith(siteUrl)) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized API Access: Invalid Origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (referer && !referer.startsWith(siteUrl)) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized API Access: Invalid Referer' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', siteUrl);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/type/:path*', '/episode/:path*'],
};
