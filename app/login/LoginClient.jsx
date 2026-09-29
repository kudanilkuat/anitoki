'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TelegramLoginWidget from '@/components/TelegramLoginWidget';

export default function LoginClient() {
  const router = useRouter();
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginWithTelegram } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const telegramBotName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      router.replace('/');
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') {
        setError('Login dibatalkan.');
      } else if (e.code === 'auth/network-request-failed') {
        setError('Tidak ada koneksi internet.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
      router.replace('/');
    } catch (e) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        setError('Email atau password salah.');
      } else if (e.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar. Silakan login.');
      } else if (e.code === 'auth/weak-password') {
        setError('Password minimal 6 karakter.');
      } else {
        setError(e.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (user) => {
    setError('');
    setLoading(true);
    try {
      await loginWithTelegram(user);
      router.replace('/');
    } catch (e) {
      setError(e.message || 'Gagal login dengan Telegram.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-deep flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-semibold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Kembali
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1">
              <span className="font-display text-3xl font-black text-primary-stitch tracking-widest italic">
                {process.env.NEXT_PUBLIC_SITE_NAME}
              </span>
            </Link>
            <p className="text-on-surface-variant text-sm mt-2">
              {mode === 'login' ? 'Masuk untuk menyimpan bookmark & riwayat baca' : 'Daftar untuk membuat akun baru'}
            </p>
          </div>

          <div className="bg-surface-elevated border border-border-subtle/30 rounded-2xl p-6 shadow-2xl">
            {/* TABS */}
            <div className="flex bg-surface-deep rounded-xl p-1 mb-6 border border-border-subtle/30">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'login' ? 'bg-primary-container text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Masuk
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'register' ? 'bg-primary-container text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Daftar
              </button>
            </div>

            {/* EMAIL FORM */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Nama</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-stitch transition-colors"
                    placeholder="Nama kamu"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-stitch transition-colors"
                  placeholder="email@contoh.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-stitch transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary-container text-on-primary text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary-container/20 disabled:opacity-50 mt-2"
              >
                {loading ? 'Memproses...' : (mode === 'login' ? 'Masuk' : 'Daftar Akun')}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border-subtle/40"></div>
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Atau</span>
              <div className="flex-1 h-px bg-border-subtle/40"></div>
            </div>

            {/* OAUTH BUTTONS */}
            <div className="space-y-3">
              <button
                onClick={handleGoogle}
                type="button"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-surface-container border border-border-subtle hover:bg-surface-bright transition-all text-sm font-bold text-on-surface disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>

              <div className="pt-2">
                <TelegramLoginWidget
                  botName={telegramBotName}
                  onAuth={handleTelegramAuth}
                  buttonSize="large"
                  cornerRadius={12}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mt-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-400 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-red-400 text-xs font-semibold">{error}</p>
              </div>
            )}

            <p className="text-center text-on-surface-variant text-[10px] mt-6 leading-relaxed">
              Dengan masuk, kamu menyetujui{' '}
              <Link href="/terms" className="text-primary-stitch hover:text-on-surface transition-colors">Syarat & Ketentuan</Link>{' '}
              kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
