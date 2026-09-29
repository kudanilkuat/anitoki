import Navbar from '@/components/Navbar';
import Link from 'next/link';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Komikcast';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komikcast.online';

export const metadata = {
  title: `Privacy Policy`,
  description: `Kebijakan Privasi ${process.env.NEXT_PUBLIC_SITE_NAME || 'Komikcast'} — bagaimana kami mengumpulkan, menggunakan, dan melindungi data kamu.`,
};

function Section({ number, title, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-none w-7 h-7 rounded-lg bg-primary-container/20 border border-primary-stitch/30 text-primary-stitch text-xs font-bold flex items-center justify-center mt-0.5">
          {number}
        </span>
        <h2 className="text-base font-bold text-on-surface leading-snug">{title}</h2>
      </div>
      <div className="pl-10 text-on-surface-variant text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface-deep">
      <Navbar />
      <main className="pt-14 pb-safe max-w-2xl mx-auto px-4">

        { }
        <div className="pt-8 pb-6 border-b border-border-subtle mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-surface-elevated border border-border-subtle rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-primary-stitch">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-on-surface tracking-widest">PRIVACY POLICY</h1>
          </div>
          <p className="text-on-surface-variant text-xs ml-12">
            Terakhir diperbarui: 8 Maret 2026 · {SITE_URL}
          </p>
        </div>

        <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
          Selamat datang di <strong className="text-on-surface">{SITE_NAME}</strong>. Kami menghargai privasi kamu dan berkomitmen untuk melindungi data pribadi yang kamu berikan saat menggunakan layanan kami.
        </p>

        <Section number="1" title="Informasi yang Kami Kumpulkan">
          <p>
            Saat kamu login menggunakan akun Google (Google OAuth), kami hanya meminta akses ke informasi profil dasar, yaitu:
          </p>
          <ul className="list-none space-y-1 mt-2">
            {['Alamat Email', 'Nama Tampilan', 'Foto Profil'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-stitch flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section number="2" title="Penggunaan Informasi">
          <p>Data dari Google hanya digunakan untuk keperluan berikut:</p>
          <ul className="list-none space-y-1 mt-2">
            {[
              'Membuat dan mengelola akun pengguna kamu di ' + SITE_NAME,
              'Menyimpan preferensi membaca, riwayat, dan bookmark komik',
              'Mengidentifikasi sesi login agar tetap aman',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-stitch flex-shrink-0 mt-1.5" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section number="3" title="Iklan & Pihak Ketiga">
          <p>
            Kami menggunakan layanan <strong className="text-on-surface">Google AdSense</strong> untuk menampilkan iklan. Google dapat menggunakan cookie untuk menampilkan iklan yang relevan berdasarkan kunjungan kamu ke situs ini dan situs lainnya.
          </p>
          <p>
            Kamu dapat menonaktifkan penggunaan cookie oleh Google melalui{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-stitch hover:underline">
              Pengaturan Iklan Google
            </a>.
          </p>
        </Section>

        <Section number="4" title="Keamanan Data">
          <p>
            Kami <strong className="text-on-surface">tidak pernah</strong> menjual, menyewakan, atau membagikan data pribadi kamu kepada pihak ketiga mana pun tanpa persetujuan kamu. Data disimpan secara aman di server kami dan hanya digunakan untuk keperluan internal layanan.
          </p>
        </Section>

        <Section number="5" title="Penghapusan Data">
          <p>
            Jika kamu ingin menghapus akun beserta seluruh data yang terkait dari server kami, silakan hubungi kami melalui email di bawah ini. Permintaan akan diproses dalam waktu 7 hari kerja.
          </p>
        </Section>

        <Section number="6" title="Perubahan Kebijakan">
          <p>
            Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Setiap perubahan akan dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.
          </p>
        </Section>

        <Section number="7" title="Kontak Kami">
          <p>
            Jika kamu memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di:
          </p>
          <a
            href="mailto:support-komikcast@googlegroups.com"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-surface-elevated border border-border-subtle rounded-xl text-primary-stitch text-sm font-semibold hover:border-primary-stitch transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            support-komikcast@googlegroups.com
          </a>
        </Section>

        <div className="border-t border-border-subtle pt-6 mt-4 flex items-center justify-between">
          <Link href="/" className="text-xs text-on-surface-variant hover:text-primary-stitch transition-colors">
            ← Kembali ke Beranda
          </Link>
          <Link href="/terms" className="text-xs text-on-surface-variant hover:text-primary-stitch transition-colors">
            Terms of Service →
          </Link>
        </div>

        <div className="h-6" />
      </main>
    </div>
  );
}
