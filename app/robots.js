const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://komikverse.com').replace(/\/+$/, '');

export default function robots() {
  return {
    rules: [

      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/user/', '/bookmarks', '/changelog', '/history', '/dl'],
      },

      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Claude-Web', disallow: '/' },
      { userAgent: 'Omgilibot', disallow: '/' },
      { userAgent: 'FacebookBot', disallow: '/' },
      { userAgent: 'PerplexityBot', disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
