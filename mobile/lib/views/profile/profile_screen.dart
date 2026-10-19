import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/bookmark_history_provider.dart';
import '../../services/storage_service.dart';
import '../../services/update_service.dart';
import 'login_screen.dart';
import 'bookmarks_screen.dart';
import 'history_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _showChangeServerDialog(BuildContext context) {
    final currentUrl = StorageService.getBaseUrl();
    final controller = TextEditingController(text: currentUrl);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.borderSubtle),
        ),
        title: const Text('Konfigurasi URL Backend API', style: TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Aplikasi terhubung ke backend API resmi Anitoki:',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(
                hintText: 'https://anitoki.id',
                labelText: 'URL API Backend',
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: [
                ActionChip(
                  label: const Text('anitoki.id (Produksi)', style: TextStyle(fontSize: 11)),
                  onPressed: () => controller.text = 'https://anitoki.id',
                ),
                ActionChip(
                  label: const Text('localhost:3000 (Dev)', style: TextStyle(fontSize: 11)),
                  onPressed: () => controller.text = 'http://localhost:3000',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              final newUrl = controller.text.trim();
              if (newUrl.isNotEmpty) {
                await StorageService.setBaseUrl(newUrl);
                if (context.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('URL Backend berhasil diubah ke: $newUrl'),
                      backgroundColor: AppColors.ongoing,
                    ),
                  );
                }
              }
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final bookmarks = context.watch<BookmarkHistoryProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Akun & Pengaturan'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.surfaceElevated,
                    AppColors.surfaceContainer,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: auth.isLoggedIn && user != null
                  ? Column(
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 30,
                              backgroundImage: NetworkImage(
                                user.photoUrl.isNotEmpty
                                    ? user.photoUrl
                                    : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(user.displayName)}&background=E97991&color=fff',
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          user.displayName,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 17,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      if (user.isPremium)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                                            ),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: const Text(
                                            'VIP',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 9,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    user.email,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: AppColors.textMuted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.sync_rounded, color: AppColors.primary),
                              tooltip: 'Sinkronkan data',
                              onPressed: () {
                                auth.refreshUser();
                                bookmarks.syncWithServer(user.googleId);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Menyinkronkan data dengan anitoki.id...')),
                                );
                              },
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),
                        const Divider(color: AppColors.borderSubtle, height: 1),
                        const SizedBox(height: 14),

                        // Stats Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatItem('Favorit', bookmarks.bookmarks.length.toString(), Icons.bookmark_rounded),
                            _buildStatItem('Riwayat', bookmarks.history.length.toString(), Icons.history_rounded),
                            _buildStatItem(
                              'Status Akun',
                              user.isPremium ? 'Member VIP' : 'Gratis',
                              user.isPremium ? Icons.workspace_premium_rounded : Icons.person_rounded,
                              isHighlight: user.isPremium,
                            ),
                          ],
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        const Icon(Icons.account_circle_outlined, size: 54, color: AppColors.primary),
                        const SizedBox(height: 12),
                        const Text(
                          'Kamu Belum Masuk',
                          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Masuk untuk sinkronisasi bookmark dan riwayat tontonan ke semua perangkat.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                            );
                          },
                          icon: const Icon(Icons.login_rounded, size: 18),
                          label: const Text('Masuk / Daftar Akun'),
                        ),
                      ],
                    ),
            ),

            const SizedBox(height: 24),

            // Section: Menu Utama
            const Padding(
              padding: EdgeInsets.only(left: 4, bottom: 8),
              child: Text(
                'AKTIVITAS SAYA',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ),

            Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.bookmark_rounded,
                    title: 'Daftar Favorit / Bookmark',
                    subtitle: '${bookmarks.bookmarks.length} anime tersimpan',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const BookmarksScreen()),
                      );
                    },
                  ),
                  const Divider(color: AppColors.borderSubtle, height: 1),
                  _buildMenuItem(
                    icon: Icons.history_rounded,
                    title: 'Riwayat Tontonan',
                    subtitle: '${bookmarks.history.length} episode terakhir ditonton',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const HistoryScreen()),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Section: Pengaturan & Konfigurasi
            const Padding(
              padding: EdgeInsets.only(left: 4, bottom: 8),
              child: Text(
                'PENGATURAN & INFORMASI',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ),

            Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceElevated,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                children: [
                  _buildMenuItem(
                    icon: Icons.dns_rounded,
                    title: 'URL Server Backend',
                    subtitle: StorageService.getBaseUrl(),
                    onTap: () => _showChangeServerDialog(context),
                  ),
                  const Divider(color: AppColors.borderSubtle, height: 1),
                  _buildMenuItem(
                    icon: Icons.language_rounded,
                    title: 'Kunjungi Website Resmi',
                    subtitle: 'anitoki.id',
                    onTap: () async {
                      final url = Uri.parse('https://anitoki.id');
                      await launchUrl(url, mode: LaunchMode.externalApplication);
                    },
                  ),
                  const Divider(color: AppColors.borderSubtle, height: 1),
                  _buildMenuItem(
                    icon: Icons.system_update_rounded,
                    title: 'Versi Aplikasi',
                    subtitle: 'Anitoki Mobile v${ApiEndpoints.currentAppVersion} (Build ${ApiEndpoints.currentAppBuildNumber}) • Periksa update',
                    onTap: () {
                      UpdateService.checkUpdate(context, isManual: true);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Logout Button if logged in
            if (auth.isLoggedIn)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    auth.logout();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Anda telah keluar dari akun.')),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.logout_rounded, size: 18),
                  label: const Text('Keluar dari Akun', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, {bool isHighlight = false}) {
    return Column(
      children: [
        Icon(icon, size: 18, color: isHighlight ? const Color(0xFFF59E0B) : AppColors.primary),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: isHighlight ? const Color(0xFFF59E0B) : Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w700),
      ),
      subtitle: Text(
        subtitle,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
      ),
      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
    );
  }
}
