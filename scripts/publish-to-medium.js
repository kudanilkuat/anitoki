/**
 * Script untuk mempublikasikan artikel ke Medium secara otomatis via Medium API.
 * 
 * Cara Penggunaan:
 * 1. Dapatkan Integration Token dari Medium:
 *    Settings -> Security and apps -> Integration tokens -> Buat token baru
 * 2. Simpan token di file .env dengan nama MEDIUM_INTEGRATION_TOKEN=...
 * 3. Jalankan: node scripts/publish-to-medium.js
 */

require('dotenv').config();

const MEDIUM_TOKEN = process.env.MEDIUM_INTEGRATION_TOKEN;

async function getMediumUser(token) {
  const response = await fetch('https://api.medium.com/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengambil data user Medium: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

async function publishStory(token, authorId, story) {
  const response = await fetch(`https://api.medium.com/v1/users/${authorId}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      title: story.title,
      contentFormat: 'markdown',
      content: story.content,
      tags: story.tags || ['Anime', 'Anime Review', 'Otaku', 'Entertainment', 'Indonesia'],
      canonicalUrl: story.canonicalUrl || 'https://anitoki.id/',
      publishStatus: story.publishStatus || 'draft', // 'public' | 'draft' | 'unlisted'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal memposting cerita ke Medium: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

// Artikel template default untuk Anitoki
const defaultStory = {
  title: '5 Rekomendasi Anime Terbaik dengan Alur Cerita Menegangkan & Tempat Nonton Sub Indo Terlengkap',
  canonicalUrl: 'https://anitoki.id/',
  tags: ['Anime', 'Anime Review', 'Otaku', 'Entertainment', 'Indonesia'],
  publishStatus: 'public', // ganti 'draft' jika ingin ditinjau dulu di Medium
  content: `# 5 Rekomendasi Anime Terbaik dengan Alur Cerita Menegangkan & Tempat Nonton Sub Indo Terlengkap

Bagi para penikmat budaya pop Jepang, anime bukan sekadar hiburan pelepas penat, melainkan medium cerita dengan kualitas animasi sinematik, penulisan karakter yang mendalam, dan premis dunia yang imajinatif. Dari pertempuran supernatural berkecepatan tinggi hingga drama psikologis yang memeras otak, industri anime terus menghadirkan karya-karya luar biasa setiap musimnya.

Namun, di tengah ribuan judul yang tersedia, mencari anime berkualitas dengan alur cerita yang tidak membosankan sering kali memakan waktu. Belum lagi tantangan menemukan portal rujukan terpercaya untuk memantau jadwal tayang dan kelengkapan episodenya.

Berikut adalah ulasan 5 rekomendasi anime terbaik pilihan editor yang wajib masuk ke dalam daftar tontonan Anda!

---

### 1. Jujutsu Kaisen: Dinamika Pertempuran Kutukan Tanpa Henti
Mengisahkan Yuji Itadori yang terjebak di dunia kutukan setelah menelan pusaka jari Ryomen Sukuna. MAPPA Studio mengeksekusi koreografi pertarungan dan dinamika karakternya dengan standar animasi kelas atas. Tiap *arc* menghadirkan intensitas yang terus meningkat tanpa memberi penonton ruang untuk bernapas lega.

### 2. Solo Leveling (Ore dake Level Up na Ken): Perjalanan Dari Terlemah Menjadi Shadow Monarch
Adaptasi manhwa legendaris yang sukses besar. Sung Jin-woo, seorang Hunter berperingkat E yang dijuluki "paling lemah", mengalami fenomena misterius dalam *Double Dungeon* yang memberikannya sistem leveling khusus seperti video game. Sensasi progresi kekuatan dan transformasi karakter membuat anime ini sangat memuaskan untuk disimak.

### 3. Sousou no Frieren (Frieren: Beyond Journey's End): Refleksi Hidup, Waktu, dan Emosi
Jika Anda menginginkan anime fantasi yang tenang, filosofis, namun tetap memiliki adegan pertempuran sihir megah dari Madhouse, *Frieren* adalah mahakarya modern. Cerita dimulai tepat setelah kelompok pahlawan mengalahkan raja iblis, berfokus pada perjalanan Frieren memahami arti hubungan manusia yang fana.

### 4. Classroom of the Elite (Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e)
Berlatar di SMA Kodo Ikusei yang tampak sempurna namun beroperasi dengan seleksi alam berbasis prestasi dan strategi manipulasi. Karakter Kiyotaka Ayanokoji menjadi pusat daya tarik dengan kemampuan analisis dingin dan taktik catur politik sekolah yang tak terduga.

### 5. Demon Slayer: Kimetsu no Yaiba
Kisah perjuangan Tanjiro Kamado menyembuhkan sang adik, Nezuko, di tengah teror iblis Muzan Kibutsuji. Ufotable menetapkan standar visual efek pernapasan dan pencahayaan 3D yang tiada duanya di industri anime modern.

---

## Di Mana Menemukan Info Lengkap, Sinopsis, dan Jadwal Rilisnya?

Menemukan anime yang seru adalah satu hal, tetapi memastikan Anda tidak ketinggalan jadwal tayang episode terbaru tiap pekannya juga sama pentingnya. 

Bagi Anda yang mencari referensi katalog anime terlengkap, sinopsis mendalam, serta pembaruan episode harian berbahasa Indonesia yang cepat dan rapi, Anda dapat mengunjungi portal **[Anitoki](https://anitoki.id/)**.

Di situs **[anitoki.id](https://anitoki.id/)**, penonton dapat dengan mudah:
- Menjelajahi katalog anime ongoing maupun yang sudah tamat (*completed*).
- Memeriksa jadwal rilis mingguan agar tidak ketinggalan episode terbaru.
- Membaca sinopsis dan ulasan lengkap setiap judul anime populer.

Simpan dan pantau terus ulasan anime terbaru melalui website resmi **[Anitoki](https://anitoki.id/)** agar pengalaman menonton anime favorit Anda semakin menyenangkan!
`,
};

async function main() {
  if (!MEDIUM_TOKEN) {
    console.error('❌ Error: MEDIUM_INTEGRATION_TOKEN belum diisi di file .env');
    console.log('💡 Langkah:');
    console.log('1. Buka Medium Settings -> Security and apps -> Integration tokens');
    console.log('2. Buat token baru, lalu tambahkan ke .env:');
    console.log('   MEDIUM_INTEGRATION_TOKEN=token_anda_disini\n');
    process.exit(1);
  }

  try {
    console.log('🔍 Mengambil informasi user Medium...');
    const user = await getMediumUser(MEDIUM_TOKEN);
    console.log(`✅ Terhubung sebagai: ${user.name} (@${user.username})`);

    console.log('🚀 Mempublikasikan artikel ke Medium...');
    const post = await publishStory(MEDIUM_TOKEN, user.id, defaultStory);

    console.log('\n🎉 Berhasil mempublikasikan artikel!');
    console.log(`📌 Judul : ${post.title}`);
    console.log(`🔗 URL   : ${post.url}`);
    console.log(`📊 Status: ${post.publishStatus}`);
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message);
  }
}

main();
