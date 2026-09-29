module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080c14',
          secondary: '#0d1220',
          card: '#111827',
          elevated: '#1a2235',
        },
        accent: {
          red: '#3b82f6',
          redDark: '#2563eb',
          orange: '#60a5fa',
          gold: '#93c5fd',
        },
        text: {
          primary: '#f0f4ff',
          secondary: '#94a3b8',
          muted: '#475569',
        },
        border: '#1e2d45',
        // ── Stitch design tokens ─────────────────────────────────────
        surface: {
          deep: '#020617',
          elevated: '#1E293B',
          container: '#0f172a',
          variant: '#1e293b',
          bright: '#334155',
        },
        'border-subtle': '#334155',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#94a3b8',
        'primary-stitch': '#c3c0ff',
        'primary-container': '#4f46e5',
        'on-primary': '#ffffff',
        'status-ongoing': '#22C55E',
        'status-expired': '#EF4444',
        'status-pending': '#F59E0B',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-nunito)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.9) 100%)',
        'gradient-hero': 'linear-gradient(135deg, #080c14 0%, #0d1a2e 50%, #080c14 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-red': 'pulseBlue 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseBlue: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(59, 130, 246, 0)' },
        },
      },
    },
  },
  plugins: [],
};
