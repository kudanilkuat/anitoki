export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const streamKey = searchParams.get('streamKey') || 'e366f437b572c237440efc22891d312f';
  const targetUrl = `https://saweria.co/widgets/leaderboard?streamKey=${streamKey}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return new Response(`Failed to fetch Saweria leaderboard (Status: ${res.status})`, {
        status: res.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    let html = await res.text();

    // Inject <base href="https://saweria.co/"> right after <head> so assets load correctly
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head><base href="https://saweria.co/">');
    } else {
      html = `<base href="https://saweria.co/">` + html;
    }

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    return new Response(`Error loading leaderboard: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
