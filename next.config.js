const nextConfig = {
  // Batasi ukuran fetch-cache (in-memory)
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50 MB
  experimental: {
    instrumentationHook: true,
  },
  images: {
    // Batasi TTL disk cache gambar — cegah .next/cache/images membengkak
    minimumCacheTTL: 3600, // 1 jam (default: tak terbatas)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/history',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/bookmarks',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/dl',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/category/:slug',
        destination: '/anime/:slug',
        permanent: true,
      },
      {
        source: '/:animeSlug-episode-:episodeNumber-subtitle-indonesia',
        destination: '/episode/:animeSlug/episode-:episodeNumber',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
