import 'package:flutter/material.dart';
import '../models/anime_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class BookmarkHistoryProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<AnimeItem> _bookmarks = [];
  List<Map<String, dynamic>> _history = [];
  bool _isLoading = false;

  BookmarkHistoryProvider({ApiService? apiService})
      : _apiService = apiService ?? ApiService() {
    _loadLocalCache();
  }

  List<AnimeItem> get bookmarks => _bookmarks;
  List<Map<String, dynamic>> get history => _history;
  bool get isLoading => _isLoading;

  void _loadLocalCache() {
    // Load cached bookmarks from local storage
    final localBms = StorageService.getLocalBookmarks();
    _bookmarks = localBms.map((b) => AnimeItem.fromJson(b)).toList();

    // Load cached history
    _history = StorageService.getLocalHistory();
  }

  bool isBookmarked(String slug) {
    return _bookmarks.any((item) => item.slug == slug);
  }

  Future<void> syncWithServer(String? googleId) async {
    if (googleId == null || googleId.isEmpty) return;
    _isLoading = true;
    notifyListeners();

    try {
      // 1. Sync Bookmarks
      final remoteBookmarks = await _apiService.getUserBookmarks(googleId);
      final List<AnimeItem> parsed = [];
      for (final item in remoteBookmarks) {
        final mangaData = item['mangaData'];
        if (mangaData != null && mangaData is Map) {
          parsed.add(AnimeItem.fromJson(Map<String, dynamic>.from(mangaData)));
        }
      }
      if (parsed.isNotEmpty) {
        _bookmarks = parsed;
        await StorageService.saveLocalBookmarks(_bookmarks.map((b) => b.toJson()).toList());
      }

      // 2. Sync History
      final remoteHistory = await _apiService.getUserHistory(googleId);
      if (remoteHistory.isNotEmpty) {
        _history = remoteHistory;
        await StorageService.saveLocalHistory(_history);
      }
    } catch (_) {
      // Keep local state on error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleBookmark(AnimeItem anime, String? googleId) async {
    final exists = isBookmarked(anime.slug);
    if (exists) {
      _bookmarks.removeWhere((item) => item.slug == anime.slug);
    } else {
      _bookmarks.insert(0, anime);
    }
    notifyListeners();

    // Save to local storage
    await StorageService.saveLocalBookmarks(_bookmarks.map((b) => b.toJson()).toList());

    // Sync to backend if logged in
    if (googleId != null && googleId.isNotEmpty) {
      try {
        await _apiService.saveBookmark(googleId, anime.slug, anime);
      } catch (_) {}
    }
  }

  Future<void> addWatchHistory({
    required AnimeItem anime,
    required String episodeTitle,
    required String episodeSlug,
    String? googleId,
  }) async {
    // Update local list
    _history.removeWhere((item) => item['slug'] == anime.slug);
    final historyEntry = {
      'slug': anime.slug,
      'title': anime.title,
      'thumb': anime.coverImage,
      'lastChapterTitle': episodeTitle,
      'lastChapterSlug': episodeSlug,
      'lastRead': DateTime.now().toIso8601String(),
    };
    _history.insert(0, historyEntry);
    notifyListeners();

    await StorageService.saveLocalHistory(_history);

    // Sync with backend if logged in
    if (googleId != null && googleId.isNotEmpty) {
      _apiService.saveHistory(
        googleId,
        slug: anime.slug,
        title: anime.title,
        thumb: anime.coverImage,
        lastChapterTitle: episodeTitle,
        lastChapterSlug: episodeSlug,
      );
    }
  }

  Future<void> clearAllHistory(String? googleId) async {
    _history.clear();
    notifyListeners();
    await StorageService.saveLocalHistory([]);

    if (googleId != null && googleId.isNotEmpty) {
      await _apiService.clearHistory(googleId);
    }
  }
}
