/**
 * ============================================================
 *  KONFIGURASI IKLAN — lib/ads.js
 * ============================================================
 *
 *  Iklan Backlink Partner: Pojokmanga (https://pojokmanga.fun)
 *  "Pojokmanga - Baca & Download Komik Manga Manhwa Bahasa Indonesia"
 */

const TARGET_URL = 'https://pojokmanga.fun';
const TARGET_TITLE = 'Pojokmanga - Baca & Download Komik Manga Manhwa Bahasa Indonesia';
const BANNER_IMG = '/ads/pojokmanga-banner.png';

// Shared Style Animation
const SHARED_STYLES = `
<style>
  @keyframes pm-pulse-glow {
    0%, 100% { box-shadow: 0 0 12px rgba(168, 85, 247, 0.4); }
    50% { box-shadow: 0 0 24px rgba(236, 72, 153, 0.7); }
  }
  @keyframes pm-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(250%); }
  }
  .pm-card {
    transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
  }
  .pm-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px -5px rgba(168, 85, 247, 0.45) !important;
    border-color: rgba(192, 132, 252, 0.8) !important;
  }
  .pm-card:hover .pm-btn {
    transform: scale(1.04);
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.75) !important;
  }
  .pm-card:hover .pm-img {
    transform: scale(1.025);
  }
  @media (max-width: 640px) {
    .pm-hide-mobile { display: none !important; }
    .pm-title { font-size: 13px !important; }
    .pm-desc { font-size: 10.5px !important; }
    .pm-btn { padding: 5px 12px !important; font-size: 11px !important; }
    .pm-badge-top { font-size: 10px !important; padding: 3px 8px !important; }
  }
</style>
`;

/**
 * 1. HERO / LEADERBOARD BANNER
 * Digunakan untuk: HEADER_BANNER, BROWSE_BANNER
 */
const BANNER_HERO = `
${SHARED_STYLES}
<div style="width: 100%; max-width: 980px; margin: 0 auto; padding: 4px;">
  <a href="${TARGET_URL}" target="_blank" rel="noopener" title="${TARGET_TITLE}" class="pm-card"
     style="display: block; position: relative; border-radius: 14px; overflow: hidden; background: linear-gradient(135deg, #090a16 0%, #15112f 50%, #0a0e20 100%); border: 1px solid rgba(168, 85, 247, 0.45); box-shadow: 0 8px 30px rgba(124, 58, 237, 0.25); text-decoration: none;">
    
    <!-- Area Gambar Banner -->
    <div style="position: relative; width: 100%; overflow: hidden; max-height: 230px; display: flex; align-items: center; justify-content: center; background: #070913;">
      <img src="${BANNER_IMG}" alt="${TARGET_TITLE}" loading="lazy" class="pm-img"
           style="width: 100%; height: auto; max-height: 230px; object-fit: cover; object-position: center; display: block; transition: transform 0.4s ease;" />
      
      <!-- Gradient Fade Bawah Gambar -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 50px; background: linear-gradient(to top, rgba(10, 11, 23, 0.95), transparent); pointer-events: none;"></div>

      <!-- Badge Pojok Kiri Atas -->
      <div class="pm-badge-top" style="position: absolute; top: 10px; left: 10px; background: rgba(10, 9, 24, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(168, 85, 247, 0.6); padding: 4px 10px; border-radius: 20px; display: flex; align-items: center; gap: 6px; z-index: 2;">
        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e;"></span>
        <span style="font-size: 11px; font-weight: 700; color: #e9d5ff; letter-spacing: 0.5px; text-transform: uppercase;">Official Partner</span>
      </div>

      <!-- Tombol CTA Pojok Kanan Atas/Bawah -->
      <div class="pm-btn" style="position: absolute; bottom: 12px; right: 12px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; padding: 7px 18px; border-radius: 24px; font-size: 13px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 18px rgba(236, 72, 153, 0.5); z-index: 2; transition: transform 0.2s ease, box-shadow 0.2s ease;">
        <span>BACA SEKARANG</span>
        <span style="font-size: 14px;">➔</span>
      </div>
    </div>

    <!-- Informasi Teks & Backlink SEO Context -->
    <div style="padding: 10px 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; background: rgba(10, 11, 23, 0.98); border-top: 1px solid rgba(168, 85, 247, 0.25);">
      <div style="display: flex; align-items: center; gap: 8px; text-align: left; flex: 1; min-width: 240px;">
        <span class="pm-title" style="background: linear-gradient(90deg, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 15px; letter-spacing: 0.5px;">POJOKMANGA</span>
        <span style="color: #475569; font-size: 12px;">•</span>
        <span class="pm-desc" style="color: #cbd5e1; font-size: 12px; font-weight: 500;">Baca &amp; Download Komik Manga Manhwa Bahasa Indonesia</span>
      </div>
      <div class="pm-hide-mobile" style="display: flex; gap: 8px; align-items: center;">
        <span style="color: #a855f7; font-size: 11px; font-weight: 600; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); padding: 2px 8px; border-radius: 6px;">⚡ Update Cepat</span>
        <span style="color: #06b6d4; font-size: 11px; font-weight: 600; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); padding: 2px 8px; border-radius: 6px;">🔥 Kualitas HD</span>
        <span style="color: #22c55e; font-size: 11px; font-weight: 600; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); padding: 2px 8px; border-radius: 6px;">100% Gratis</span>
      </div>
    </div>
  </a>
</div>
`;

/**
 * 2. IN-CONTENT / STREAM BANNER
 * Digunakan untuk: IN_CONTENT, BEFORE_EPISODES, STREAM_TOP, STREAM_BOTTOM, DOWNLOAD_TOP, DOWNLOAD_BOTTOM
 */
const BANNER_CONTENT = `
${SHARED_STYLES}
<div style="width: 100%; max-width: 900px; margin: 0 auto; padding: 4px;">
  <a href="${TARGET_URL}" target="_blank" rel="noopener" title="${TARGET_TITLE}" class="pm-card"
     style="display: block; position: relative; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #090a16 0%, #13102c 100%); border: 1px solid rgba(168, 85, 247, 0.4); box-shadow: 0 6px 25px rgba(124, 58, 237, 0.2); text-decoration: none;">
    
    <div style="position: relative; width: 100%; overflow: hidden; max-height: 180px; display: flex; align-items: center; justify-content: center; background: #060710;">
      <img src="${BANNER_IMG}" alt="${TARGET_TITLE}" loading="lazy" class="pm-img"
           style="width: 100%; height: auto; max-height: 180px; object-fit: cover; object-position: center; display: block; transition: transform 0.4s ease;" />
      
      <!-- Overlay CTA -->
      <div class="pm-btn" style="position: absolute; bottom: 10px; right: 10px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.5); z-index: 2;">
        <span>BACA KOMIK</span>
        <span>➔</span>
      </div>
    </div>

    <div style="padding: 8px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; background: rgba(9, 10, 22, 0.98); border-top: 1px solid rgba(168, 85, 247, 0.2);">
      <div style="display: flex; align-items: center; gap: 8px; text-align: left; overflow: hidden;">
        <span class="pm-title" style="background: linear-gradient(90deg, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 13.5px; white-space: nowrap;">POJOKMANGA</span>
        <span style="color: #475569; font-size: 11px;">•</span>
        <span class="pm-desc" style="color: #94a3b8; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Pojokmanga - Baca &amp; Download Komik Manga Manhwa Bahasa Indonesia</span>
      </div>
      <span class="pm-hide-mobile" style="color: #38bdf8; font-size: 11px; font-weight: 600; white-space: nowrap;">⚡ Komik Terlengkap</span>
    </div>
  </a>
</div>
`;

/**
 * 3. STICKY BOTTOM AD
 * Digunakan untuk: STICKY_BOTTOM
 * Didesain ringkas (compact), tidak menutupi layar, nyaman di mobile & desktop.
 */
const BANNER_STICKY = `
${SHARED_STYLES}
<div style="width: 100%; max-width: 850px; margin: 0 auto; padding: 2px 10px;">
  <a href="${TARGET_URL}" target="_blank" rel="noopener" title="${TARGET_TITLE}" class="pm-card"
     style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: linear-gradient(90deg, rgba(12, 10, 28, 0.95), rgba(22, 16, 48, 0.95)); border: 1px solid rgba(168, 85, 247, 0.5); box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35); border-radius: 12px; padding: 6px 12px; text-decoration: none; backdrop-filter: blur(10px);">
    
    <div style="display: flex; align-items: center; gap: 10px; text-align: left; overflow: hidden; flex: 1;">
      <!-- Thumbnail Gambar Iklan -->
      <div style="position: relative; width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(168, 85, 247, 0.6);">
        <img src="${BANNER_IMG}" alt="Pojokmanga" style="width: 100%; height: 100%; object-fit: cover; object-position: right center; display: block;" />
      </div>

      <!-- Teks Backlink -->
      <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="pm-title" style="background: linear-gradient(90deg, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 13.5px; letter-spacing: 0.5px;">POJOKMANGA</span>
          <span style="background: #22c55e; color: #ffffff; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; text-transform: uppercase;">Gratis</span>
          <span class="pm-hide-mobile" style="color: #e9d5ff; font-size: 11px; font-weight: 600;">Sub Indonesia</span>
        </div>
        <p class="pm-desc" style="margin: 0; color: #94a3b8; font-size: 11px; overflow: hidden; text-overflow: ellipsis;">
          Baca &amp; Download Komik Manga Manhwa Bahasa Indonesia
        </p>
      </div>
    </div>

    <!-- Tombol CTA -->
    <div class="pm-btn" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 11.5px; font-weight: 800; white-space: nowrap; box-shadow: 0 3px 12px rgba(236, 72, 153, 0.45); display: flex; align-items: center; gap: 4px; flex-shrink: 0; transition: transform 0.2s ease;">
      <span>Buka Komik</span>
      <span style="font-size: 12px;">➔</span>
    </div>
  </a>
</div>
`;

/**
 * 4. PURE IMAGE BANNER (Alternatif jika hanya ingin menampilkan gambar langsung)
 */
const BANNER_IMAGE_ONLY = `
<div style="width: 100%; max-width: 900px; margin: 0 auto; padding: 4px;">
  <a href="${TARGET_URL}" target="_blank" rel="noopener" title="${TARGET_TITLE}"
     style="display: block; border-radius: 12px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.4); box-shadow: 0 6px 25px rgba(124, 58, 237, 0.25); text-decoration: none; transition: transform 0.25s ease;">
    <img src="${BANNER_IMG}" alt="${TARGET_TITLE}" loading="lazy"
         style="width: 100%; height: auto; max-height: 220px; object-fit: cover; display: block;" />
  </a>
</div>
`;

export const ADS_CONFIG = {

  // ─── AKTIFKAN / MATIKAN SEMUA IKLAN ──────────────────────
  ENABLED: true,

  // ─── PILIH JARINGAN IKLAN ('custom' | 'adsense') ─────────
  NETWORK: 'custom',

  // ─── TEMPLATES POJOKMANGA (Tersedia untuk kustomisasi) ──
  POJOKMANGA: {
    URL: TARGET_URL,
    IMAGE: BANNER_IMG,
    TITLE: TARGET_TITLE,
    HERO: BANNER_HERO,
    CONTENT: BANNER_CONTENT,
    STICKY: BANNER_STICKY,
    IMAGE_ONLY: BANNER_IMAGE_ONLY,
  },

  // ─── GOOGLE ADSENSE ──────────────────────────────────────
  ADSENSE: {
    CLIENT_ID: 'ca-pub-5891820539797449',
    SLOTS: {
      HEADER_BANNER: '',
      IN_CONTENT: '',
      BEFORE_EPISODES: '',
      STREAM_TOP: '',
      STREAM_BOTTOM: '',
      BROWSE_BANNER: '',
      STICKY_BOTTOM: '',
      DOWNLOAD_TOP: '',
      DOWNLOAD_BOTTOM: '',
    },
  },

  // ─── ADSTERRA / CUSTOM HTML ──────────────────────────────
  CUSTOM: {
    // SLOTS: Untuk iklan banner Pojokmanga (tanpa tag script eksternal)
    SLOTS: {
      HEADER_BANNER: BANNER_HERO,
      IN_CONTENT: BANNER_CONTENT,
      STREAM_TOP: BANNER_CONTENT,
      STREAM_BOTTOM: BANNER_CONTENT,
      BEFORE_EPISODES: BANNER_CONTENT,
      BROWSE_BANNER: BANNER_HERO,
      STICKY_BOTTOM: BANNER_STICKY,
      DOWNLOAD_TOP: BANNER_CONTENT,
      DOWNLOAD_BOTTOM: BANNER_CONTENT,
    },

    // SCRIPT_GLOBAL: URL script saja (bukan tag HTML lengkap)
    SCRIPT_GLOBAL: {
      SRC: '',
      DATA_ATTRIBUTES: {},
    },

    // Atau jika script inline:
    INLINE_SCRIPT: ``,
  },
};
