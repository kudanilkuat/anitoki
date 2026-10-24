/**
 * ============================================================
 *  KONFIGURASI IKLAN — lib/ads.js
 * ============================================================
 */

export const ADS_CONFIG = {

  // ─── AKTIFKAN / MATIKAN SEMUA IKLAN ──────────────────────
  ENABLED: true,

  // ─── PILIH JARINGAN IKLAN ────────────────────────────────
  NETWORK: 'custom',

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
    // SLOTS: Untuk iklan banner (tanpa tag script)
    SLOTS: {
      HEADER_BANNER: ``,
      IN_CONTENT: ``,
      STREAM_TOP: ``,
      STREAM_BOTTOM: ``,
      BEFORE_EPISODES: ``,
      BROWSE_BANNER: ``,
      STICKY_BOTTOM: ``,
      DOWNLOAD_TOP: ``,
      DOWNLOAD_BOTTOM: ``,
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
