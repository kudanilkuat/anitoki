import 'package:flutter/material.dart';
import '../models/anime_model.dart';
import '../models/genre_model.dart';
import '../services/api_service.dart';

class BrowseProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<AnimeItem> _animes = [];
  List<GenreModel> _genres = [];

  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;

  int _currentPage = 1;
  int _totalPages = 1;

  String _searchQuery = '';
  String? _selectedGenre;
  String _selectedStatus = 'all'; // 'all', 'ongoing', 'completed'
  String _selectedType = 'all';   // 'all', 'TV', 'Movie', 'OVA', 'BD'
  String _selectedOrder = 'latest'; // 'latest', 'popular', 'az', 'za'

  BrowseProvider({ApiService? apiService}) : _apiService = apiService ?? ApiService() {
    loadGenres();
    fetchAnimeList();
  }

  List<AnimeItem> get animes => _animes;
  List<GenreModel> get genres => _genres;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;
  bool get hasMore => _currentPage < _totalPages;

  String get searchQuery => _searchQuery;
  String? get selectedGenre => _selectedGenre;
  String get selectedStatus => _selectedStatus;
  String get selectedType => _selectedType;
  String get selectedOrder => _selectedOrder;

  Future<void> loadGenres() async {
    try {
      _genres = await _apiService.getGenres();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> fetchAnimeList({bool resetPage = true}) async {
    if (resetPage) {
      _currentPage = 1;
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

    try {
      final res = await _apiService.getAnimeList(
        query: _searchQuery.isNotEmpty ? _searchQuery : null,
        genre: _selectedGenre,
        status: _selectedStatus,
        type: _selectedType,
        order: _selectedOrder,
        page: _currentPage,
        limit: 24,
      );

      final List<AnimeItem> items = res['animes'];
      final Map<String, dynamic> pagination = res['pagination'];
      _totalPages = (pagination['totalPages'] as num?)?.toInt() ?? 1;

      if (resetPage) {
        _animes = items;
      } else {
        _animes.addAll(items);
      }

      _isLoading = false;
      _isLoadingMore = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _isLoadingMore = false;
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  Future<void> loadMore() async {
    if (_isLoadingMore || !hasMore) return;
    _isLoadingMore = true;
    _currentPage++;
    notifyListeners();
    await fetchAnimeList(resetPage: false);
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    fetchAnimeList(resetPage: true);
  }

  void setFilter({
    String? genre,
    String? status,
    String? type,
    String? order,
  }) {
    if (genre != null) _selectedGenre = genre == 'all' ? null : genre;
    if (status != null) _selectedStatus = status;
    if (type != null) _selectedType = type;
    if (order != null) _selectedOrder = order;
    fetchAnimeList(resetPage: true);
  }

  void resetFilters() {
    _searchQuery = '';
    _selectedGenre = null;
    _selectedStatus = 'all';
    _selectedType = 'all';
    _selectedOrder = 'latest';
    fetchAnimeList(resetPage: true);
  }
}
