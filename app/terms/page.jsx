import Navbar from '@/components/Navbar';
import Link from 'next/link';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Komikcast';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://komikcast.online';

export const metadata = {
  title: `Terms of Service`,
  description: `Syarat dan Ketentuan Layanan ${process.env.NEXT_PUBLIC_SITE_NAME || 'Komikcast'} — aturan penggunaan layanan yang wajib kamu pahami.`,
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

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-surface-deep">
      <Navbar />
      <main className="pt-14 pb-safe max-w-2xl mx-auto px-4">

        { }
        <div className="pt-8 pb-6 border-b border-border-subtle mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-surface-elevated border border-border-subtle rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-primary-stitch">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-on-surface tracking-widest">TERMS OF SERVICE</h1>
          </div>
          <p className="text-on-surface-variant text-xs ml-12">
            Terakhir diperbarui: 8 Maret 2026 · {SITE_URL}
          </p>
        </div>

        <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
          Dengan mengakses dan menggunakan <strong className="text-on-surface">{SITE_NAME}</strong> ({SITE_URL}), kamu setuju untuk terikat oleh Syarat dan Ketentuan Layanan ini serta{' '}
          <Link href="/privacy-policy" className="text-primary-stitch hover:underline">Kebijakan Privasi</Link> kami.
          Jika kamu tidak setuju, mohon untuk tidak menggunakan layanan ini.
        </p>

        <Section number="1" title="Penerimaan Syarat">
          <p>
            Penggunaan layanan ini berarti kamu telah membaca, memahami, dan menyetujui seluruh ketentuan yang berlaku. Kami berhak mengubah ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya.
          </p>
        </Section>

        <Section number="2" title="Penggunaan Layanan">
          <p>Layanan ini disediakan hanya untuk keperluan hiburan pribadi. Kamu setuju untuk <strong className="text-on-surface">tidak</strong>:</p>
          <ul className="list-none space-y-1.5 mt-2">
            {[
              'Menggunakan layanan ini untuk tujuan ilegal atau melanggar hukum yang berlaku',
              'Mencoba mengganggu kinerja server, keamanan, atau infrastruktur website',
              'Mengumpulkan atau mengekstrak data dari website secara otomatis (scraping) tanpa izin',
              'Membuat banyak akun palsu untuk menyalahgunakan sistem atau melakukan spam',
              'Mendistribusikan konten yang bersifat berbahaya, merusak, atau melanggar hak cipta',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-stitch flex-shrink-0 mt-1.5" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section number="3" title="Akun Pengguna">
          <p>
            Kamu bertanggung jawab penuh atas keamanan akun dan kata sandi kamu. Jangan pernah membagikan informasi login kepada siapa pun.
          </p>
          <p>
            Kami berhak <strong className="text-on-surface">menangguhkan atau menghapus</strong> akun yang terbukti melanggar aturan penggunaan layanan tanpa pemberitahuan sebelumnya.
          </p>
        </Section>

        <Section number="4" title="Konten & Hak Cipta">
          <p>
            {SITE_NAME} adalah platform streaming yang mengumpulkan informasi dari sumber-sumber yang tersedia di internet. Kami tidak mengklaim kepemilikan atas konten anime yang ditampilkan.
          </p>
          <p>
            Jika kamu adalah pemilik hak cipta dan merasa konten kamu ditampilkan tanpa izin, silakan hubungi kami untuk penghapusan segera.
          </p>
        </Section>

        <Section number="5" title="Iklan">
          <p>
            Layanan ini menggunakan <strong className="text-on-surface">Google AdSense</strong> untuk menampilkan iklan guna mendukung operasional website. Dengan menggunakan layanan ini, kamu menyetujui tampilan iklan tersebut.
          </p>
        </Section>

        <Section number="6" title="Penafian (Disclaimer)">
          <p>
            Layanan disediakan <em>"sebagaimana adanya"</em> tanpa jaminan apa pun, baik tersurat maupun tersirat. Kami tidak menjamin bahwa website akan selalu tersedia, bebas dari gangguan teknis, atau error.
          </p>
          <p>
            Kami tidak bertanggung jawab atas kerugian apa pun yang timbul dari penggunaan layanan ini.
          </p>
        </Section>

        <Section number="7" title="Perubahan Ketentuan">
          <p>
            Kami dapat memperbarui Ketentuan Layanan ini sewaktu-waktu. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini dengan tanggal pembaruan terbaru. Penggunaan layanan setelah perubahan dianggap sebagai persetujuanmu.
          </p>
        </Section>

        <Section number="8" title="Kontak">
          <p>
            Untuk pertanyaan atau laporan terkait ketentuan layanan, silakan hubungi kami di:
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
          <Link href="/privacy-policy" className="text-xs text-on-surface-variant hover:text-primary-stitch transition-colors">
            ← Privacy Policy
          </Link>
          <Link href="/" className="text-xs text-on-surface-variant hover:text-primary-stitch transition-colors">
            Kembali ke Beranda →
          </Link>
        </div>

        <div className="h-6" />
      </main>
    </div>
  );
}
