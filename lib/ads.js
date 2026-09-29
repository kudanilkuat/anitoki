/**
 * ============================================================
 *  KONFIGURASI IKLAN — lib/ads.js
 * ============================================================
 */

export const ADS_CONFIG = {

  // ─── AKTIFKAN / MATIKAN SEMUA IKLAN ──────────────────────
  ENABLED: true,

  // ─── PILIH JARINGAN IKLAN ────────────────────────────────
  NETWORK: 'adsense',

  // ─── GOOGLE ADSENSE ──────────────────────────────────────
  ADSENSE: {
    CLIENT_ID: 'ca-pub-5891820539797449',
    SLOTS: {
      HEADER_BANNER: '',
      IN_CONTENT: '',
      BEFORE_CHAPTERS: '',
      READER_TOP: '',
      READER_BOTTOM: '',
      BROWSE_BANNER: '',
      STICKY_BOTTOM: '',
    },
  },

  // ─── ADSTERRA / CUSTOM HTML ──────────────────────────────
  CUSTOM: {
    // SLOTS: Untuk iklan banner (tanpa tag script)
    SLOTS: {
      HEADER_BANNER: ``,
      IN_CONTENT: ``,
      READER_TOP: ``,
      READER_BOTTOM: ``,
      BEFORE_CHAPTERS: ``,
      BROWSE_BANNER: ``,
      STICKY_BOTTOM: ``,
    },

    // SCRIPT_GLOBAL: URL script saja (bukan tag HTML lengkap)
    SCRIPT_GLOBAL: {
      SRC: '', // URL script
      DATA_ATTRIBUTES: {} // Data attributes jika ada
    },

    // Atau jika script inline:
    INLINE_SCRIPT: ``,
  },
};
