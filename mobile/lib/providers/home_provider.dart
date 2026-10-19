import 'package:flutter/material.dart';
import '../models/anime_model.dart';
import '../services/api_service.dart';

class HomeProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<AnimeItem> _recents = [];
  List<AnimeItem> _trending = [];
  List<AnimeItem> _ongoing = [];
  List<AnimeItem> _completed = [];
  List<AnimeItem> _bannerItems = [];

  bool _isLoading = false;
  String? _error;

  HomeProvider({ApiService? apiService}) : _apiService = apiService ?? ApiService() {
    loadHomeData();
  }

  List<AnimeItem> get recents => _recents;
  List<AnimeItem> get trending => _trending;
  List<AnimeItem> get ongoing => _ongoing;
  List<AnimeItem> get completed => _completed;
  List<AnimeItem> get bannerItems => _bannerItems;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadHomeData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.getHomeData();
      _recents = res['recents'] as List<AnimeItem>;
      _trending = res['trending'] as List<AnimeItem>;
      _ongoing = res['ongoing'] as List<AnimeItem>;
      _completed = res['completed'] as List<AnimeItem>;

      // Banner: combine top trending and ongoing with highest ratings
      final pool = [..._trending, ..._ongoing];
      pool.sort((a, b) => b.rating.compareTo(a.rating));
      final seen = <String>{};
      _bannerItems = pool.where((item) => seen.add(item.slug)).take(5).toList();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }
}
