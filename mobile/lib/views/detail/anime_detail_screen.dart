import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/anime_model.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/bookmark_history_provider.dart';
import '../player/video_player_screen.dart';
import '../home/widgets/anime_card.dart';

class AnimeDetailScreen extends StatefulWidget {
  final String slug;
  final AnimeItem? initialAnime;

  const AnimeDetailScreen({
    super.key,
    required this.slug,
    this.initialAnime,
  });

  @override
  State<AnimeDetailScreen> createState() => _AnimeDetailScreenState();
}

class _AnimeDetailScreenState extends State<AnimeDetailScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _episodeSearchController = TextEditingController();

  AnimeDetailInfo? _detailInfo;
  List<AnimeItem> _recommendations = [];
  bool _isLoading = true;
  String? _error;
  bool _isSynopsisExpanded = false;
  bool _isEpisodesReversed = false;

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  @override
  void dispose() {
    _episodeSearchController.dispose();
    super.dispose();
  }

  Future<void> _fetchDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await _apiService.getAnimeDetail(widget.slug);
      setState(() {
        _detailInfo = res['info'] as AnimeDetailInfo;
        _recommendations = res['recommendations'] as List<AnimeItem>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final bookmarks = context.watch<BookmarkHistoryProvider>();

    final title = _detailInfo?.title ?? widget.initialAnime?.title ?? 'Detail Anime';
    final coverImage = _detailInfo?.coverImage ?? widget.initialAnime?.coverImage ?? '';
    final rating = _detailInfo?.rating ?? widget.initialAnime?.rating ?? 0.0;
    final status = _detailInfo?.status ?? widget.initialAnime?.status;
    final type = _detailInfo?.type ?? widget.initialAnime?.type;

    final isFav = bookmarks.isBookmarked(widget.slug);

    // Current anime object for bookmarking
    final currentAnime = _detailInfo ?? widget.initialAnime ?? AnimeItem(
      id: widget.slug,
      title: title,
      slug: widget.slug,
      coverImage: coverImage,
      type: type,
      status: status,
      rating: rating,
    );

    // Episodes filtering & ordering
    final allEpisodes = _detailInfo?.episodes ?? widget.initialAnime?.episodes ?? [];
    List<EpisodeSummary> displayEpisodes = [...allEpisodes];
    if (_isEpisodesReversed) {
      displayEpisodes = displayEpisodes.reversed.toList();
    }
    if (_episodeSearchController.text.isNotEmpty) {
      final q = _episodeSearchController.text.toLowerCase();
      displayEpisodes = displayEpisodes.where((ep) => ep.title.toLowerCase().contains(q)).toList();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Collapsible Backdrop SliverAppBar
          SliverAppBar(
            expandedHeight: 330,
            pinned: true,
            backgroundColor: AppColors.surfaceElevated,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isFav ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                    color: isFav ? AppColors.primary : Colors.white,
                    size: 20,
                  ),
                ),
                onPressed: () {
                  bookmarks.toggleBookmark(currentAnime, auth.user?.googleId);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        isFav ? 'Dihapus dari Favorit' : 'Disimpan ke Favorit',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      duration: const Duration(seconds: 1),
                      backgroundColor: AppColors.surfaceElevated,
                    ),
                  );
                },
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Blurred Backdrop
                  if (coverImage.isNotEmpty)
                    CachedNetworkImage(
                      imageUrl: coverImage,
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
                    ),
                  BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                    child: Container(
                      color: Colors.black.withOpacity(0.6),
                    ),
                  ),

                  // Bottom Gradient
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppColors.background,
                        ],
                        stops: [0.3, 1.0],
                      ),
                    ),
                  ),

                  // Poster & Basic Info
                  Positioned(
                    bottom: 20,
                    left: 20,
                    right: 20,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        // Poster Card
                        ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            width: 105,
                            height: 150,
                            decoration: BoxDecoration(
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.5),
                                  blurRadius: 10,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: CachedNetworkImage(
                              imageUrl: coverImage,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),

                        const SizedBox(width: 16),

                        // Title & Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Type & Status Badges
                              Row(
                                children: [
                                  if (type != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        type,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                  const SizedBox(width: 6),
                                  if (status != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                      decoration: BoxDecoration(
                                        color: status.toLowerCase().contains('ongoing')
                                            ? AppColors.ongoing.withOpacity(0.2)
                                            : AppColors.completed.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: status.toLowerCase().contains('ongoing')
                                              ? AppColors.ongoing
                                              : AppColors.completed,
                                          width: 0.8,
                                        ),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          color: status.toLowerCase().contains('ongoing')
                                              ? AppColors.ongoing
                                              : AppColors.completed,
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                ],
                              ),

                              const SizedBox(height: 8),

                              // Title
                              Text(
                                title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
                                  height: 1.2,
                                ),
                              ),

                              const SizedBox(height: 6),

                              // Rating
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: AppColors.starRating, size: 16),
                                  const SizedBox(width: 4),
                                  Text(
                                    rating > 0 ? rating.toStringAsFixed(1) : 'N/A',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12.5,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  if (_detailInfo?.views != null) ...[
                                    const Icon(Icons.remove_red_eye_outlined, color: AppColors.textMuted, size: 14),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${_detailInfo!.views} views',
                                      style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Body Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 16),

                  // Action Buttons Row
                  Row(
                    children: [
                      // Watch First Episode
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            if (allEpisodes.isNotEmpty) {
                              final firstEp = allEpisodes.first;
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => VideoPlayerScreen(
                                    animeSlug: widget.slug,
                                    episodeSlug: firstEp.slug,
                                    episodeTitle: firstEp.title,
                                    anime: currentAnime,
                                  ),
                                ),
                              );
                            }
                          },
                          icon: const Icon(Icons.play_arrow_rounded, size: 20),
                          label: Text(
                            allEpisodes.isNotEmpty ? 'Mulai Tonton' : 'Belum Ada Episode',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Bookmark Quick Toggle
                      IconButton(
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.surfaceElevated,
                          padding: const EdgeInsets.all(14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                            side: const BorderSide(color: AppColors.borderSubtle),
                          ),
                        ),
                        icon: Icon(
                          isFav ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
                          color: isFav ? AppColors.primary : AppColors.textSecondary,
                        ),
                        onPressed: () {
                          bookmarks.toggleBookmark(currentAnime, auth.user?.googleId);
                        },
                      ),
                    ],
                  ),

                  if (_isLoading && _detailInfo == null)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                    ),

                  if (_error != null && _detailInfo == null)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text(
                          _error!,
                          style: const TextStyle(color: AppColors.error, fontSize: 13),
                        ),
                      ),
                    ),

                  const SizedBox(height: 20),

                  // Genre Chips
                  if (_detailInfo?.genres.isNotEmpty ?? false) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _detailInfo!.genres.map((g) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceElevated,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.borderSubtle),
                          ),
                          child: Text(
                            g,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Synopsis Section
                  if (_detailInfo?.synopsis != null && _detailInfo!.synopsis!.isNotEmpty) ...[
                    const Text(
                      'Sinopsis',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _detailInfo!.synopsis!,
                      maxLines: _isSynopsisExpanded ? null : 4,
                      overflow: _isSynopsisExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                    InkWell(
                      onTap: () => setState(() => _isSynopsisExpanded = !_isSynopsisExpanded),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                          _isSynopsisExpanded ? 'Sembunyikan' : 'Baca Selengkapnya',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Extra Metadata Info Grid
                  _buildMetadataInfo(),

                  const SizedBox(height: 26),

                  // Episode List Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Daftar Episode',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainer,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${allEpisodes.length} eps',
                              style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: Icon(
                          _isEpisodesReversed ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                          color: AppColors.textSecondary,
                          size: 20,
                        ),
                        tooltip: 'Urutkan episode',
                        onPressed: () => setState(() => _isEpisodesReversed = !_isEpisodesReversed),
                      ),
                    ],
                  ),

                  // Search Episode Input if many episodes
                  if (allEpisodes.length > 6) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: _episodeSearchController,
                      onChanged: (_) => setState(() {}),
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: InputDecoration(
                        hintText: 'Cari nomor / judul episode...',
                        prefixIcon: const Icon(Icons.search_rounded, size: 16, color: AppColors.textMuted),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                  ],

                  const SizedBox(height: 12),

                  // Episodes List
                  if (displayEpisodes.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text(
                          'Episode tidak ditemukan.',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: displayEpisodes.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final ep = displayEpisodes[index];
                        return InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => VideoPlayerScreen(
                                  animeSlug: widget.slug,
                                  episodeSlug: ep.slug,
                                  episodeTitle: ep.title,
                                  anime: currentAnime,
                                ),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceElevated,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.borderSubtle, width: 0.8),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceContainer,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.play_arrow_rounded, color: AppColors.primary, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        ep.title,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      if (ep.airDate != null)
                                        Text(
                                          ep.airDate!,
                                          style: const TextStyle(
                                            color: AppColors.textMuted,
                                            fontSize: 11,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                              ],
                            ),
                          ),
                        );
                      },
                    ),

                  const SizedBox(height: 30),

                  // Recommendations Section
                  if (_recommendations.isNotEmpty) ...[
                    const Text(
                      'Rekomendasi Anime Serupa',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 220,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _recommendations.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          return AnimeCard(anime: _recommendations[index], width: 130);
                        },
                      ),
                    ),
                  ],

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetadataInfo() {
    if (_detailInfo == null) return const SizedBox.shrink();

    final meta = [
      if (_detailInfo?.studio != null) {'label': 'Studio', 'value': _detailInfo!.studio!},
      if (_detailInfo?.duration != null) {'label': 'Durasi', 'value': _detailInfo!.duration!},
      if (_detailInfo?.airDate != null) {'label': 'Rilis', 'value': _detailInfo!.airDate!},
      if (_detailInfo?.producer != null) {'label': 'Produser', 'value': _detailInfo!.producer!},
    ];

    if (meta.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Wrap(
        spacing: 16,
        runSpacing: 10,
        children: meta.map((m) {
          return SizedBox(
            width: 140,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  m['label']!,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 10.5, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  m['value']!,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
