import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/bookmark_history_provider.dart';
import '../home/widgets/anime_card.dart';

class BookmarksScreen extends StatelessWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bookmarks = context.watch<BookmarkHistoryProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Anime Favorit'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync_rounded),
            tooltip: 'Sinkronkan dengan server',
            onPressed: () {
              if (auth.user?.googleId != null) {
                bookmarks.syncWithServer(auth.user!.googleId);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Menyinkronkan favorit...')),
                );
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surfaceElevated,
        onRefresh: () async {
          if (auth.user?.googleId != null) {
            await bookmarks.syncWithServer(auth.user!.googleId);
          }
        },
        child: bookmarks.bookmarks.isEmpty
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.bookmark_border_rounded, size: 64, color: AppColors.textMuted),
                      const SizedBox(height: 16),
                      const Text(
                        'Belum Ada Anime Favorit',
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Jelajahi anime dan tekan tombol bookmark untuk menyimpannya di sini.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Jelajah Sekarang'),
                      ),
                    ],
                  ),
                ),
              )
            : GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 0.52,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 16,
                ),
                itemCount: bookmarks.bookmarks.length,
                itemBuilder: (context, index) {
                  return AnimeCard(
                    anime: bookmarks.bookmarks[index],
                    width: double.infinity,
                  );
                },
              ),
      ),
    );
  }
}
