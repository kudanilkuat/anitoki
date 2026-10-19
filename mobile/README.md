# 📱 Anitoki Mobile App (Flutter)

Aplikasi mobile streaming anime subtitle Indonesia modern untuk Android & iOS, terintegrasi penuh dengan backend API **[anitoki.id](https://anitoki.id)** dan sistem login **Google Firebase Auth**.

---

## ✨ Fitur Utama (Key Features)

- 🎬 **Beranda (Home Feed)**:
  - Featured & Trending Banner Carousel otomatis dengan rating dan shortcut tonton.
  - Quick Category Chips: Ongoing, Completed, Movies, TV Series.
  - Daftar anime berdasarkan: *Episode Terbaru*, *Anime Populer*, *Sedang Berlangsung*, dan *Anime Tamat*.
  - Pull-to-refresh & skeleton shimmer loading.

- 🔍 **Jelajah & Pencarian Lengkap (Explore & Filter)**:
  - Pencarian judul anime dengan debounce real-time.
  - Bottom sheet filter canggih:
    - **Filter Genre**: Puluhan genre langsung dari API backend (`/api/genres`).
    - **Status**: Semua, Ongoing, Completed.
    - **Tipe**: Semua, TV, Movie, OVA, BD.
    - **Urutan**: Terbaru, Terpopuler, A-Z, Z-A.
  - Infinite scrolling pagination (muat otomatis saat scroll ke bawah).

- 📖 **Halaman Detail Anime**:
  - Tampilan poster & backdrop dinamis dengan efek blur modern.
  - Metadata lengkap (Rating bintang, tipe, status, studio, durasi, tanggal rilis, dan total view).
  - Sinopsis lengkap dengan toggle *Baca Selengkapnya*.
  - Daftar episode lengkap dengan fitur pencarian nomor/judul episode & tombol urutkan episode (terbaru/terlama).
  - Rekomendasi anime serupa berdasarkan genre.

- ⚡ **Pemutar Video Streaming (Smart Player)**:
  - Pemutar video responsif dengan dukungan multi-server (DesuWatch, FileDon, VidHide, dll.).
  - Navigasi episode instan (*Prev Ep*, *Daftar Episode*, *Next Ep*).
  - Mode layar penuh (Fullscreen) otomatis lanskap.
  - Integrasi pencatatan riwayat tontonan otomatis ke akun pengguna.

- ⬇️ **Pilihan Download Multi-Kualitas**:
  - Bottom sheet unduhan dengan pilihan resolusi (360p, 480p, 720p).
  - Tautan mirror unduhan langsung (Mega, LetsUpload, Racaty, Solidfiles, dll.).

- 🔐 **Autentikasi & Profil Pengguna**:
  - **Login dengan Google (Firebase Auth)**: Sinkronisasi instan ke database MongoDB `anitoki.id`.
  - **Login & Daftar Email/Password**: Menggunakan Firebase Identity Toolkit REST API.
  - **Mode Tamu (Guest Mode)**: Pengguna dapat langsung streaming tanpa dipaksa login.
  - Tampilan status akun (Member VIP / Gratis) dan total menit menonton.

- 📚 **Favorit (Bookmarks) & Riwayat (History)**:
  - Sinkronisasi bookmark dua arah ke cloud backend (`/api/users/:googleId/library`).
  - Riwayat tontonan dengan tombol pintas *Lanjut Nonton* langsung ke episode terakhir.
  - Cache lokal offline via SharedPreferences.

- ⚙️ **Konfigurasi URL Backend Fleksibel**:
  - Secara default terhubung ke `https://anitoki.id`.
  - Dilengkapi dialog pengubah URL API backend (dapat beralih ke `http://localhost:3000` untuk keperluan testing lokal).

- 🚀 **Notifikasi & Popup Update Otomatis (In-App Update)**:
  - Pemeriksaan otomatis saat aplikasi dibuka melalui endpoint `/api/app/version`.
  - Popup modal pembaruan modern dengan indikator versi lama ➔ baru, changelog *Yang Baru di Versi Ini*, dan tombol unduh langsung.
  - Dukungan **Force Update** (wajib update) maupun update opsional yang dapat ditutup.
  - Tombol manual periksa pembaruan di menu Akun / Profil (`Versi Aplikasi`).
  - Pengaturan rilis pembaruan dapat dikontrol langsung dari backend di file [app/api/app/version/route.js](file:///d:/anitoki/app/api/app/version/route.js).

---

## 🛠️ Tech Stack

- **Framework**: Flutter 3.41+ (Dart 3.11+)
- **State Management**: Provider (`provider: ^6.1.2`)
- **Networking**: `http: ^1.2.0`
- **Video & WebView**: `webview_flutter: ^4.7.0`
- **Image Caching**: `cached_network_image: ^3.3.1`
- **Penyimpanan Lokal**: `shared_preferences: ^2.2.3`
- **Deep Link & Launcher**: `url_launcher: ^6.2.6`
- **Typography & Theme**: Google Fonts (`google_fonts: ^6.2.1` Outfit Text Theme)

---

## 📁 Struktur Direktori

```
mobile/
├── android/                  # Konfigurasi native Android (Permissions, Manifest, Gradle)
├── ios/                      # Konfigurasi native iOS
├── lib/
│   ├── main.dart             # Entry point aplikasi & MultiProvider setup
│   ├── core/
│   │   ├── constants/
│   │   │   └── api_endpoints.dart # Definisi URL API anitoki.id & Firebase
│   │   └── theme/
│   │       └── app_theme.dart     # Dark anime theme, palet warna & tipografi
│   ├── models/
│   │   ├── anime_model.dart       # Model Anime, Detail, dan Episode Summary
│   │   ├── episode_model.dart     # Model Server Streaming & Download Mirrors
│   │   ├── genre_model.dart       # Model Genre
│   │   └── user_model.dart        # Model Profil Pengguna
│   ├── services/
│   │   ├── api_service.dart       # Service REST API backend anitoki.id
│   │   ├── auth_service.dart      # Service Autentikasi Google & Firebase
│   │   └── storage_service.dart   # Service SharedPreferences & Cache
│   ├── providers/
│   │   ├── auth_provider.dart     # State manajemen user & login
│   │   ├── home_provider.dart     # State data beranda & carousel
│   │   ├── browse_provider.dart   # State pencarian, filter, & pagination
│   │   └── bookmark_history_provider.dart # State bookmark & riwayat
│   ├── views/
│   │   ├── main_navigation_screen.dart # 4 Bottom navigation bar utama
│   │   ├── home/
│   │   │   ├── home_screen.dart
│   │   │   └── widgets/ (banner_slider, anime_card, section_header)
│   │   ├── browse/
│   │   │   ├── browse_screen.dart
│   │   │   └── widgets/ (filter_sheet)
│   │   ├── detail/
│   │   │   └── anime_detail_screen.dart
│   │   ├── player/
│   │   │   ├── video_player_screen.dart
│   │   │   └── widgets/ (download_bottom_sheet)
│   │   └── profile/
│   │       ├── profile_screen.dart
│   │       ├── login_screen.dart
│   │       ├── bookmarks_screen.dart
│   │       └── history_screen.dart
│   └── widgets/
│       └── shimmer_loading.dart
└── pubspec.yaml
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Masuk ke direktori mobile
```bash
cd mobile
```

### 2. Unduh dependencies
```bash
flutter pub get
```

### 3. Jalankan aplikasi pada Emulator atau Device
```bash
flutter run
```

### 4. Build APK Android
```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release
```
Hasil file APK akan berada di `mobile/build/app/outputs/flutter-apk/app-release.apk`.

---

## 🎨 Asset Store (APKPure & Google Play Console)

File gambar pendukung untuk rilis di app store telah disiapkan di folder `mobile/screenshots/`:
- **Feature Graphic (1024 x 500 px, 24-bit PNG & JPEG)**:
  - `mobile/screenshots/feature_graphic.png`
  - `mobile/screenshots/feature_graphic.jpg`
- **Screenshots Aplikasi (1080 x 1920 Full HD)**:
  - `mobile/screenshots/1080p/screenshot_home_1080x1920.png`
  - `mobile/screenshots/1080p/screenshot_browse_1080x1920.png`
  - `mobile/screenshots/1080p/screenshot_detail_1080x1920.png`
  - `mobile/screenshots/1080p/screenshot_player_1080x1920.png`
