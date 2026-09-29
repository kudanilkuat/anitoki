'use client';

import Navbar from '@/components/Navbar';

const CHANGELOGS = [
  {
    version: 'v1.6.0',
    date: new Date().toISOString().split('T')[0],
    label: 'Pembaruan UI',
    labelColor: 'bg-pink-500/20 border-pink-500/40 text-pink-400',
    dotColor: 'bg-pink-400',
    changes: [
      {
        type: 'feature',
        title: 'Perombakan Antarmuka (UI) Eksplorasi Kategori',
        desc: 'Halaman /genres kini tampil dengan layar penuh, menambahkan dukungan untuk mencari berdasarkan Tema dan Grafis (Demografi) dengan kartu visual yang lebih modern dan bercahaya.',
      },
      {
        type: 'feature',
        title: 'Hero Banner Dinamis & Filter Lanjutan',
        desc: 'Daftar anime (/anime) kini dihiasi oleh Hero Banner yang warnanya menyesuaikan (Merah/Ungu/Oranye/Biru) berdasarkan filter aktif. Tombol Tema & Grafis juga telah ditambahkan ke menu Filter.',
      },
      {
        type: 'feature',
        title: 'Penyegaran Tampilan Bookmark & Riwayat',
        desc: 'Halaman Bookmark dan History dirombak dengan Hero Banner mewah. Khusus halaman History kini beralih dari sekadar list panjang menjadi format Grid Responsif agar lebih rapi di layar monitor besar.',
      },
    ],
  },
  {
    version: 'v1.5.0',
    date: '2026-05-21',
    label: 'Fitur Baru',
    labelColor: 'bg-green-500/20 border-green-500/40 text-green-400',
    dotColor: 'bg-green-400',
    changes: [
      {
        type: 'feature',
        title: 'Sistem Pembayaran QRIS',
        desc: 'Pembayaran premium kini menggunakan QRIS statis.',
      },
      {
        type: 'feature',
        title: 'Sistem Koin Loyalty — Dapatkan Premium Gratis',
        desc: 'Setiap aktivasi paket premium memberikan +20 koin. Kumpulkan 3.000 koin dan tukar dengan 7 hari premium gratis langsung dari halaman profil!',
      },
      {
        type: 'feature',
        title: 'Dompet Koin di Profil',
        desc: 'Halaman profil kini menampilkan saldo koin, progress bar menuju hadiah, dan tombol tukar koin — tersedia meski belum ada order aktif.',
      },
      {
        type: 'feature',
        title: 'Riwayat Pembayaran di Profil',
        desc: 'Semua order premium (pending & approved) tampil di halaman profil. User bisa cek status, upload bukti, lihat QR, dan hapus order yang tidak diperlukan.',
      },
      {
        type: 'feature',
        title: 'Hapus Pending Order',
        desc: 'User dapat menghapus order yang masih pending langsung dari profil. Dilengkapi konfirmasi dua langkah untuk mencegah penghapusan tidak disengaja.',
      },
    ],
  },

  {
    version: 'v1.4.2',
    date: '2026-03-08',
    label: 'Perbaikan & Optimasi',
    labelColor: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    dotColor: 'bg-yellow-400',
    changes: [
      {
        type: 'fix',
        title: 'Optimasi Episode 1000+ — Tidak Lagi Berat',
        desc: 'Daftar episode di halaman detail kini menggunakan paginasi (50 per halaman) dan fitur pencarian, sehingga anime dengan ratusan episode tidak memperlambat halaman.',
      },
      {
        type: 'fix',
        title: 'Cache Daftar Episode di Player',
        desc: 'Popup episode di player kini menyimpan daftar episode ke cache sementara. Saat pindah episode dalam anime yang sama, tidak ada request ulang ke server.',
      },
      {
        type: 'fix',
        title: 'Popup Episode Player — Pencarian & Paginasi',
        desc: 'Popup daftar episode di player kini bisa dicari dan dimuat bertahap (100 per halaman), sehingga tidak lag meskipun ada 1000+ episode.',
      },
      {
        type: 'fix',
        title: 'Perbaikan Limit Library & History',
        desc: 'API Library dan History tidak lagi memuat 9999 data sekaligus. Kini menggunakan limit 100 untuk performa yang lebih baik.',
      },
    ],
  },

  {
    version: 'v1.4.1',
    date: '2026-04-10',
    label: 'hotfix',
    labelColor: 'bg-red-500/20 border-red-500/40 text-red-400',
    dotColor: 'bg-accent-red',
    changes: [
      {
        type: 'fix',
        title: 'Transfer Database ke vps agar lebih stabil',
        desc: 'Pindah database dari shared hosting ke VPS untuk meningkatkan stabilitas dan kecepatan akses, terutama saat traffic tinggi.',
      },
      {
        type: 'fix',
        title: 'Perbaikan Libary Dan History',
        desc: 'Sekarang Libary dan History akan tersimpan dengan benar. dan tidak lagi di cache akan realtime',
      },
    ],
  },
  {
    version: 'v1.4.0',
    date: '2026-03-05',
    label: 'Fitur Baru',
    labelColor: 'bg-green-500/20 border-green-500/40 text-green-400',
    dotColor: 'bg-green-400',
    changes: [
      {
        type: 'feature',
        title: 'Edit Profil',
        desc: 'User sekarang bisa mengubah nama tampilan, foto profil, dan bio langsung dari halaman profil.',
      },
      {
        type: 'feature',
        title: 'Notifikasi Pembaruan',
        desc: 'Setiap kali ada pembaruan besar, pengguna akan menerima notifikasi di changelog.',
      },
      {
        type: 'fix',
        title: 'Peningkatan Performa',
        desc: 'Optimasi backend untuk mempercepat waktu muat halaman dan respons server.',
      },
      {
        type: 'feature',
        title: 'Mode Gelap Otomatis',
        desc: 'Website kini bisa beralih ke mode gelap secara otomatis berdasarkan preferensi sistem pengguna.',
      },
      {
        type: 'feature',
        title: 'Changelog Page',
        desc: 'Halaman ini — ringkasan semua pembaruan dan perbaikan yang telah dilakukan pada website.',
      },
    ],
  },

  {
    version: 'v1.3.0',
    date: '2025-12-20',
    label: 'hotfix',
    labelColor: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    dotColor: 'bg-yellow-400',
    changes: [
      {
        type: 'fix',
        title: 'Perbaikan Bug',
        desc: 'Perbaikan pada history dan libary yang menyebabkan beberapa pengguna mengalami masalah saat mengakses halaman tertentu.',
      },
    ],
  },
];

function TypeIcon({ type }) {
  if (type === 'feature') return (
    <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 text-green-400">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
  return (
    <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 text-yellow-400">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="pt-14 pb-safe max-w-2xl mx-auto px-4">

        <div className="pt-6 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-bg-card border border-border rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-accent-red">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-text-primary tracking-widest">CHANGELOG</h1>
          </div>
          <p className="text-text-muted text-xs mt-1 ml-12">Riwayat pembaruan dan perbaikan Komikcast</p>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Fitur Baru
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />Perbaikan
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />Hotfix
          </span>
        </div>

        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-8">
            {CHANGELOGS.map((log, i) => (
              <div key={log.version} className="relative pl-7">
                <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-bg-primary ${log.dotColor} shadow-lg`} />

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="font-display text-lg text-text-primary tracking-wider">{log.version}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${log.labelColor}`}>
                    {log.label}
                  </span>
                  <span className="text-text-muted text-[10px] ml-auto">
                    {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {log.changes.map((change, j) => (
                    <div key={j} className="flex gap-2.5 bg-bg-card border border-border rounded-xl p-3 hover:border-accent-red/20 transition-colors">
                      <TypeIcon type={change.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-xs font-bold leading-snug">{change.title}</p>
                        <p className="text-text-muted text-[11px] mt-1 leading-relaxed">{change.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 py-5 border-t border-border text-center">
          <p className="text-text-muted text-[11px]">{process.env.NEXT_PUBLIC_SITE_NAME || 'Doujindesu'} — terus diperbarui 🚀</p>
        </div>
      </main>
    </div>
  );
}
