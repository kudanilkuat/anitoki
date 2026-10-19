# 🎬 Anitoki - Modern Anime Streaming Platform

[![Website](https://img.shields.io/badge/Website-anitoki.id-E97991?style=for-the-badge&logo=googlechrome&logoColor=white)](https://anitoki.id)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**[Anitoki](https://anitoki.id)** adalah platform streaming anime subtitle Indonesia modern, cepat, dan responsif. Dibangun menggunakan Next.js App Router, Tailwind CSS, MongoDB, dan pemutar video HLS adaptif berkualitas tinggi (1080p, 720p, 480p, 360p).

🌐 **Kunjungi Website Resmi:** [https://anitoki.id](https://anitoki.id) — Nonton anime sub Indo terlengkap dan update setiap hari secara gratis.

---

## ✨ Fitur Utama (Key Features)

- ⚡ **Super Fast Streaming** - Pemutar video responsif dengan dukungan Multi-Server (DesuStream, Doodstream, dll.) dan HLS Stream.
- 🎨 **Modern Dark UI** - Desain UI/UX futuristik bergaya glassmorphism yang nyaman untuk mata (Dark Mode).
- 🔍 **Pencarian Canggih & Filter** - Cari anime berdasarkan judul, genre, status (Ongoing/Completed), tipe (TV/Movie/OVA), dan urutan update.
- 📚 **Bookmark & Riwayat Tontonan** - Simpan anime favorit ke Bookmark dan sinkronisasi riwayat tontonan otomatis.
- 💬 **Sistem Komentar & Profil Interaktif** - Diskusi episode, komentar bertingkat, dan personalisasi profil pengguna.
- 💎 **Sistem VIP & Top-Up Otomatis** - Integrasi pembayaran QRIS instan via WijayaPay & sistem wallet koin.
- 🔐 **Autentikasi Fleksibel** - Login mudah dan instan menggunakan Telegram Auth dan Google Firebase.
- 📱 **Aplikasi Mobile (Flutter)** - Tersedia aplikasi mobile Android & iOS terintegrasi langsung dengan API anitoki.id dan login Google Firebase.
- 🚀 **SEO & Performance Optimized** - Dinamis XML sitemap (`/sitemap.xml`, `/sitemap-anime.xml`), meta tags OpenGraph, dan schema markup.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & API Routes)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via Mongoose
- **Authentication**: Firebase Authentication & Telegram OAuth
- **Video Player**: HLS.js (Adaptive Bitrate Streaming)
- **Payment Gateway**: WijayaPay QRIS API
- **Deployment**: Node.js / Vercel / VPS

---

## 🚀 Panduan Instalasi Lokal (Getting Started)

### 1. Clone Repository
```bash
git clone https://github.com/kudanilkuat/anitoki.git
cd anitoki
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di root direktori proyek dan sesuaikan variabel konfigurasi:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/anitoki?retryWrites=true&w=majority

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://anitoki.id
NEXT_PUBLIC_SITE_NAME=Anitoki

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# WijayaPay Gateway
WIJAYAPAY_API_KEY=your_wijayapay_api_key
WIJAYAPAY_MERCHANT_ID=your_merchant_id
```

### 4. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🔗 Official Links & Resources

- 🌐 **Official Website**: [https://anitoki.id](https://anitoki.id)
- 📖 **Daftar Anime Terbaru**: [https://anitoki.id/anime](https://anitoki.id/anime)
- 🏷️ **Jelajah Genre**: [https://anitoki.id/genres](https://anitoki.id/genres)
- 📌 **Changelog**: [https://anitoki.id/changelog](https://anitoki.id/changelog)

---

## 📄 Lisensi (License)

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

<p align="center">
  Dibuat dengan ❤️ untuk komunitas pecinta anime Indonesia. Kunjungi <a href="https://anitoki.id"><b>Anitoki</b></a> untuk update anime sub indo tercepat.
</p>
