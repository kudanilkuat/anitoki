import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/home_provider.dart';
import '../../providers/browse_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/anime_model.dart';
import '../../widgets/shimmer_loading.dart';
import 'widgets/banner_slider.dart';
import 'widgets/anime_card.dart';
import 'widgets/section_header.dart';

class HomeScreen extends StatelessWidget {
  final Function(int)? onTabChange;

  const HomeScreen({super.key, this.onTabChange});

  @override
  Widget build(BuildContext context) {
    final home = context.watch<HomeProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/icons/app_icon.png',
                width: 28,
                height: 28,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 8),
            RichText(
              text: const TextSpan(
                text: 'ANI',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 20,
                  letterSpacing: 1.5,
                ),
                children: [
                  TextSpan(
                    text: 'TOKI',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, size: 24),
            onPressed: () {
              if (onTabChange != null) {
                onTabChange!(1); // Switch to browse tab
              }
            },
          ),
          IconButton(
            icon: auth.isLoggedIn
                ? CircleAvatar(
                    radius: 14,
                    backgroundImage: NetworkImage(
                      auth.user?.photoUrl ??
                          'https://ui-avatars.com/api/?name=${Uri.encodeComponent(auth.user?.displayName ?? "U")}',
                    ),
                  )
                : const Icon(Icons.account_circle_outlined, size: 26),
            onPressed: () {
              if (onTabChange != null) {
                onTabChange!(3); // Switch to profile tab
              }
            },
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surfaceElevated,
        onRefresh: () => home.loadHomeData(),
        child: home.isLoading && home.recents.isEmpty
            ? _buildLoadingSkeleton()
            : home.error != null && home.recents.isEmpty
                ? _buildErrorView(context, home)
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.only(bottom: 30),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 12),

                        // Featured Banner Carousel
                        if (home.bannerItems.isNotEmpty)
                          BannerSlider(items: home.bannerItems),

                        const SizedBox(height: 18),

                        // Quick Filter Category Chips
                        _buildQuickCategoryChips(context),

                        const SizedBox(height: 24),

                        // Section 1: Episode Terbaru (Recents)
                        SectionHeader(
                          title: 'Episode Terbaru',
                          subtitle: 'Update anime subtitle Indonesia',
                          icon: Icons.bolt_rounded,
                          onSeeAll: () {
                            context.read<BrowseProvider>().setFilter(order: 'latest');
                            if (onTabChange != null) onTabChange!(1);
                          },
                        ),
                        const SizedBox(height: 12),
                        _buildHorizontalAnimeList(home.recents),

                        const SizedBox(height: 28),

                        // Section 2: Anime Populer (Trending)
                        SectionHeader(
                          title: 'Anime Populer',
                          subtitle: 'Paling banyak ditonton',
                          icon: Icons.local_fire_department_rounded,
                          onSeeAll: () {
                            context.read<BrowseProvider>().setFilter(order: 'popular');
                            if (onTabChange != null) onTabChange!(1);
                          },
                        ),
                        const SizedBox(height: 12),
                        _buildHorizontalAnimeList(home.trending),

                        const SizedBox(height: 28),

                        // Section 3: Anime Ongoing
                        SectionHeader(
                          title: 'Sedang Berlangsung (Ongoing)',
                          subtitle: 'Episode baru setiap minggu',
                          icon: Icons.play_circle_fill_rounded,
                          onSeeAll: () {
                            context.read<BrowseProvider>().setFilter(status: 'ongoing');
                            if (onTabChange != null) onTabChange!(1);
                          },
                        ),
                        const SizedBox(height: 12),
                        _buildHorizontalAnimeList(home.ongoing),

                        const SizedBox(height: 28),

                        // Section 4: Anime Tamat (Completed)
                        SectionHeader(
                          title: 'Anime Tamat (Completed)',
                          subtitle: 'Bisa langsung maraton sampai tamat',
                          icon: Icons.check_circle_rounded,
                          onSeeAll: () {
                            context.read<BrowseProvider>().setFilter(status: 'completed');
                            if (onTabChange != null) onTabChange!(1);
                          },
                        ),
                        const SizedBox(height: 12),
                        _buildHorizontalAnimeList(home.completed),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildQuickCategoryChips(BuildContext context) {
    final categories = [
      {'label': 'Ongoing', 'icon': Icons.sync_rounded, 'status': 'ongoing', 'type': null},
      {'label': 'Completed', 'icon': Icons.done_all_rounded, 'status': 'completed', 'type': null},
      {'label': 'Movie', 'icon': Icons.movie_filter_rounded, 'status': null, 'type': 'Movie'},
      {'label': 'TV Series', 'icon': Icons.tv_rounded, 'status': null, 'type': 'TV'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: categories.map((cat) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                context.read<BrowseProvider>().setFilter(
                      status: cat['status'] as String?,
                      type: cat['type'] as String?,
                    );
                if (onTabChange != null) onTabChange!(1);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderSubtle, width: 1),
                ),
                child: Row(
                  children: [
                    Icon(cat['icon'] as IconData, size: 16, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Text(
                      cat['label'] as String,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildHorizontalAnimeList(List<AnimeItem> items) {
    if (items.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Text(
          'Tidak ada data anime.',
          style: TextStyle(color: AppColors.textMuted, fontSize: 13),
        ),
      );
    }

    return SizedBox(
      height: 250,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          return AnimeCard(anime: items[index], width: 135);
        },
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ShimmerBox(width: double.infinity, height: 210, borderRadius: 20),
          const SizedBox(height: 24),
          const ShimmerBox(width: 160, height: 20),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, __) => const ShimmerBox(width: 135, height: 210, borderRadius: 14),
            ),
          ),
          const SizedBox(height: 28),
          const ShimmerBox(width: 160, height: 20),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, __) => const ShimmerBox(width: 135, height: 210, borderRadius: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(BuildContext context, HomeProvider home) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, color: AppColors.error, size: 48),
            const SizedBox(height: 16),
            Text(
              home.error ?? 'Gagal memuat data dari anitoki.id',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => home.loadHomeData(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Coba Lagi'),
            ),
          ],
        ),
      ),
    );
  }
}
