import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-deep">
      <Navbar />
      <main className="pt-14 pb-safe max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen text-center px-4">
        <p className="font-display text-8xl text-primary-stitch tracking-widest mb-4">404</p>
        <h1 className="font-display text-2xl text-on-surface tracking-widest mb-2">HALAMAN TIDAK DITEMUKAN</h1>
        <p className="text-on-surface-variant text-sm mb-8">Anime atau episode yang kamu cari mungkin sudah dihapus atau tidak ada.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-primary-container text-on-primary font-bold rounded-xl hover:brightness-110 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </main>
    </div>
  );
}
