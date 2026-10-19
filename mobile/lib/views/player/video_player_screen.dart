import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/theme/app_theme.dart';
import '../../models/anime_model.dart';
import '../../models/episode_model.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/bookmark_history_provider.dart';
import 'widgets/download_bottom_sheet.dart';

class VideoPlayerScreen extends StatefulWidget {
  final String animeSlug;
  final String episodeSlug;
  final String episodeTitle;
  final AnimeItem anime;

  const VideoPlayerScreen({
    super.key,
    required this.animeSlug,
    required this.episodeSlug,
    required this.episodeTitle,
    required this.anime,
  });

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  final ApiService _apiService = ApiService();

  late String _currentEpisodeSlug;
  late String _currentEpisodeTitle;

  EpisodeDetailData? _episodeData;
  bool _isLoading = true;
  String? _error;

  int _selectedServerIndex = 0;
  WebViewController? _webViewController;
  bool _isPlayerLoading = true;
  bool _isFullscreen = false;

  @override
  void initState() {
    super.initState();
    _currentEpisodeSlug = widget.episodeSlug;
    _currentEpisodeTitle = widget.episodeTitle;
    _loadEpisodeData();
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    super.dispose();
  }

  Future<void> _loadEpisodeData() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _isPlayerLoading = true;
    });

    try {
      final data = await _apiService.getEpisodeDetail(widget.animeSlug, _currentEpisodeSlug);
      setState(() {
        _episodeData = data;
        _currentEpisodeTitle = data.title;
        _selectedServerIndex = 0;
        _isLoading = false;
      });

      // Auto save watch history
      if (mounted) {
        final auth = context.read<AuthProvider>();
        context.read<BookmarkHistoryProvider>().addWatchHistory(
              anime: widget.anime,
              episodeTitle: data.title,
              episodeSlug: _currentEpisodeSlug,
              googleId: auth.user?.googleId,
            );
      }

      _initPlayer(0);
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _initPlayer(int serverIndex) {
    if (_episodeData == null || _episodeData!.servers.isEmpty) return;

    final server = _episodeData!.servers[serverIndex];
    final url = server.url;

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _isPlayerLoading = true),
          onPageFinished: (_) => setState(() => _isPlayerLoading = false),
          onWebResourceError: (_) => setState(() => _isPlayerLoading = false),
        ),
      );

    if (url.isNotEmpty) {
      controller.loadRequest(Uri.parse(url));
    }

    setState(() {
      _selectedServerIndex = serverIndex;
      _webViewController = controller;
    });
  }

  void _toggleFullscreen() {
    setState(() {
      _isFullscreen = !_isFullscreen;
      if (_isFullscreen) {
        SystemChrome.setPreferredOrientations([
          DeviceOrientation.landscapeLeft,
          DeviceOrientation.landscapeRight,
        ]);
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
      } else {
        SystemChrome.setPreferredOrientations([
          DeviceOrientation.portraitUp,
        ]);
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      }
    });
  }

  void _navigateToEpisode(String episodeSlug) {
    setState(() {
      _currentEpisodeSlug = episodeSlug;
    });
    _loadEpisodeData();
  }

  @override
  Widget build(BuildContext context) {
    if (_isFullscreen) {
      return WillPopScope(
        onWillPop: () async {
          _toggleFullscreen();
          return false;
        },
        child: Scaffold(
          backgroundColor: Colors.black,
          body: Stack(
            fit: StackFit.expand,
            children: [
              if (_webViewController != null) WebViewWidget(controller: _webViewController!),
              Positioned(
                top: 20,
                right: 20,
                child: IconButton(
                  icon: const Icon(Icons.fullscreen_exit_rounded, color: Colors.white, size: 28),
                  onPressed: _toggleFullscreen,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.anime.title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.download_rounded),
            tooltip: 'Download Episode',
            onPressed: () {
              if (_episodeData?.downloads != null) {
                showModalBottomSheet(
                  context: context,
                  backgroundColor: Colors.transparent,
                  isScrollControlled: true,
                  builder: (_) => DownloadBottomSheet(
                    downloads: _episodeData!.downloads,
                    animeTitle: widget.anime.title,
                    episodeTitle: _currentEpisodeTitle,
                  ),
                );
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _error != null
              ? _buildErrorView()
              : SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Video Player Container
                      _buildVideoPlayer(),

                      // Episode Navigation Bar
                      _buildNavigationBar(),

                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Episode Title & Anime Name
                            Text(
                              _currentEpisodeTitle,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              widget.anime.title,
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 13,
                              ),
                            ),

                            const SizedBox(height: 20),

                            // Server Streaming Selector
                            _buildServerSelector(),

                            const SizedBox(height: 20),

                            // Download Box
                            if (_episodeData?.downloads.isNotEmpty ?? false)
                              _buildDownloadQuickCard(),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildVideoPlayer() {
    return Container(
      width: double.infinity,
      color: Colors.black,
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (_webViewController != null)
              WebViewWidget(controller: _webViewController!)
            else
              const Center(
                child: Text(
                  'Server tidak tersedia',
                  style: TextStyle(color: AppColors.textMuted),
                ),
              ),

            // Loader
            if (_isPlayerLoading)
              Container(
                color: Colors.black87,
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: AppColors.primary),
                      SizedBox(height: 12),
                      Text(
                        'Memuat pemutar streaming...',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),

            // Fullscreen Button
            Positioned(
              bottom: 8,
              right: 8,
              child: IconButton(
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black.withOpacity(0.6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.fullscreen_rounded, color: Colors.white, size: 22),
                onPressed: _toggleFullscreen,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavigationBar() {
    final nav = _episodeData;
    final hasPrev = nav?.prevSlug != null && nav!.prevSlug!.isNotEmpty;
    final hasNext = nav?.nextSlug != null && nav!.nextSlug!.isNotEmpty;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: AppColors.surfaceElevated,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Previous Episode Button
          Expanded(
            child: OutlinedButton.icon(
              onPressed: hasPrev ? () => _navigateToEpisode(nav.prevSlug!) : null,
              icon: const Icon(Icons.chevron_left_rounded, size: 18),
              label: const Text('Prev Ep', style: TextStyle(fontSize: 11.5)),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                disabledForegroundColor: AppColors.textMuted.withOpacity(0.3),
                side: BorderSide(color: hasPrev ? AppColors.borderSubtle : Colors.transparent),
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // All Episodes Modal Button
          ElevatedButton.icon(
            onPressed: () => _showAllEpisodesBottomSheet(),
            icon: const Icon(Icons.list_rounded, size: 16),
            label: const Text('Semua Episode', style: TextStyle(fontSize: 11.5)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.surfaceContainer,
              foregroundColor: AppColors.textPrimary,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: const BorderSide(color: AppColors.borderSubtle),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Next Episode Button
          Expanded(
            child: ElevatedButton.icon(
              onPressed: hasNext ? () => _navigateToEpisode(nav.nextSlug!) : null,
              label: const Text('Next Ep', style: TextStyle(fontSize: 11.5)),
              icon: const Icon(Icons.chevron_right_rounded, size: 18),
              style: ElevatedButton.styleFrom(
                backgroundColor: hasNext ? AppColors.primary : AppColors.surfaceContainer,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.surfaceContainer.withOpacity(0.5),
                disabledForegroundColor: AppColors.textMuted.withOpacity(0.3),
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServerSelector() {
    final servers = _episodeData?.servers ?? [];
    if (servers.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSubtle, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.dns_rounded, color: AppColors.primary, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Pilihan Server Streaming',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
              Text(
                '${servers.length} Server',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(servers.length, (idx) {
              final isSelected = _selectedServerIndex == idx;
              return ChoiceChip(
                label: Text(servers[idx].name),
                selected: isSelected,
                selectedColor: AppColors.primary,
                backgroundColor: AppColors.surfaceContainer,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                  fontSize: 11.5,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(
                    color: isSelected ? AppColors.primary : AppColors.borderSubtle,
                  ),
                ),
                onSelected: (_) => _initPlayer(idx),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildDownloadQuickCard() {
    final downloads = _episodeData!.downloads;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () {
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => DownloadBottomSheet(
            downloads: downloads,
            animeTitle: widget.anime.title,
            episodeTitle: _currentEpisodeTitle,
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.download_rounded, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Unduh / Download Episode Ini',
                    style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Tersedia ${downloads.length} pilihan kualitas (360p, 480p, 720p)',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }

  void _showAllEpisodesBottomSheet() {
    final episodes = widget.anime.episodes;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.7,
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: AppColors.surfaceElevated,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Daftar Episode',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.separated(
                  itemCount: episodes.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, idx) {
                    final ep = episodes[idx];
                    final isCurrent = ep.slug == _currentEpisodeSlug;
                    return ListTile(
                      tileColor: isCurrent ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceContainer,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(color: isCurrent ? AppColors.primary : Colors.transparent),
                      ),
                      leading: Icon(
                        isCurrent ? Icons.play_circle_fill_rounded : Icons.play_circle_outline_rounded,
                        color: isCurrent ? AppColors.primary : AppColors.textSecondary,
                      ),
                      title: Text(
                        ep.title,
                        style: TextStyle(
                          color: isCurrent ? AppColors.primary : Colors.white,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                          fontSize: 13,
                        ),
                      ),
                      onTap: () {
                        Navigator.pop(context);
                        _navigateToEpisode(ep.slug);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 48),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Gagal memuat episode streaming',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _loadEpisodeData,
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      ),
    );
  }
}
