import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_endpoints.dart';
import '../models/anime_model.dart';
import '../models/episode_model.dart';
import '../models/genre_model.dart';
import '../models/user_model.dart';
import '../models/app_version_model.dart';
import 'storage_service.dart';

class ApiService {
  final http.Client _client;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

  String get _baseUrl => StorageService.getBaseUrl();

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  // ─── HOME DATA ─────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getHomeData({int page = 1, int limit = 24}) async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.home}?page=$page&limit=$limit');
    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      if (json['success'] == true && json['data'] != null) {
        final data = json['data'];

        List<AnimeItem> parseList(dynamic raw) {
          if (raw is List) {
            return raw.map((item) => AnimeItem.fromJson(Map<String, dynamic>.from(item))).toList();
          }
          return [];
        }

        return {
          'recents': parseList(data['recents']),
          'trending': parseList(data['trending']),
          'ongoing': parseList(data['ongoing']),
          'completed': parseList(data['completed']),
          'pagination': json['pagination'] ?? {},
        };
      }
    }
    throw Exception('Gagal memuat data beranda (${response.statusCode})');
  }

  // ─── ANIME LIST / BROWSE / SEARCH ──────────────────────────────────────────
  Future<Map<String, dynamic>> getAnimeList({
    String? query,
    String? genre,
    String? status,
    String? type,
    String? order,
    int page = 1,
    int limit = 24,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (query != null && query.isNotEmpty) params['q'] = query;
    if (genre != null && genre.isNotEmpty && genre != 'all') params['genre'] = genre;
    if (status != null && status.isNotEmpty && status != 'all') params['status'] = status;
    if (type != null && type.isNotEmpty && type != 'all') params['type'] = type;
    if (order != null && order.isNotEmpty) params['order'] = order;

    final uri = Uri.parse('$_baseUrl${ApiEndpoints.animeList}').replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      if (json['success'] == true && json['data'] != null) {
        final rawList = json['data'] as List;
        final animes = rawList
            .map((item) => AnimeItem.fromJson(Map<String, dynamic>.from(item)))
            .toList();
        return {
          'animes': animes,
          'pagination': json['pagination'] ?? {},
        };
      }
    }
    throw Exception('Gagal memuat daftar anime (${response.statusCode})');
  }

  // ─── ANIME DETAIL ──────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getAnimeDetail(String slug) async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.animeDetail(slug)}');
    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      if (json['success'] == true && json['data'] != null) {
        final data = json['data'];
        final infoJson = Map<String, dynamic>.from(data['info'] ?? {});
        final detailInfo = AnimeDetailInfo.fromJson(infoJson);

        List<AnimeItem> recommendations = [];
        if (data['recommendations'] is List) {
          recommendations = (data['recommendations'] as List)
              .map((r) => AnimeItem.fromJson(Map<String, dynamic>.from(r)))
              .toList();
        }

        return {
          'info': detailInfo,
          'recommendations': recommendations,
        };
      }
    }
    throw Exception('Gagal memuat detail anime (${response.statusCode})');
  }

  // ─── EPISODE DETAIL & STREAM ───────────────────────────────────────────────
  Future<EpisodeDetailData> getEpisodeDetail(String animeSlug, String episodeSlug) async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.episodeDetail(animeSlug, episodeSlug)}');
    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      if (json['success'] == true && json['data'] != null) {
        return EpisodeDetailData.fromJson(Map<String, dynamic>.from(json['data']));
      }
    }
    throw Exception('Gagal memuat episode streaming (${response.statusCode})');
  }

  // ─── GENRES ────────────────────────────────────────────────────────────────
  Future<List<GenreModel>> getGenres() async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.genres}');
    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      if (json['success'] == true && json['data'] != null) {
        final raw = json['data']['genres'];
        if (raw is List) {
          return raw
              .map((g) => GenreModel.fromJson(Map<String, dynamic>.from(g)))
              .toList();
        }
      }
    }
    return [];
  }

  // ─── APP VERSION & UPDATE ──────────────────────────────────────────────────
  Future<AppVersionModel?> getAppVersion() async {
    try {
      final uri = Uri.parse('$_baseUrl${ApiEndpoints.appVersion}');
      final response = await _client.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json['success'] == true && json['data'] != null) {
          return AppVersionModel.fromJson(Map<String, dynamic>.from(json['data']));
        }
      }
    } catch (_) {}
    return null;
  }

  // ─── USER SYNC ─────────────────────────────────────────────────────────────
  Future<UserModel> syncUser({
    required String googleId,
    required String email,
    required String displayName,
    String photoUrl = '',
  }) async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.userSync}');
    final response = await _client.post(
      uri,
      headers: _headers,
      body: jsonEncode({
        'googleId': googleId,
        'email': email,
        'displayName': displayName,
        'photoURL': photoUrl,
      }),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      if (json['success'] == true && json['data'] != null) {
        return UserModel.fromJson(Map<String, dynamic>.from(json['data']));
      }
    }
    throw Exception('Gagal sinkronisasi data user dengan backend anitoki.id');
  }

  // ─── USER BOOKMARKS / LIBRARY ──────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> getUserBookmarks(String googleId) async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.userLibrary(googleId)}?limit=100');
    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      if (json['success'] == true && json['data'] != null) {
        final list = json['data'] as List;
        return list.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [];
  }

  Future<bool> saveBookmark(String googleId, String slug, AnimeItem anime) async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.userLibrary(googleId)}');
    final response = await _client.post(
      uri,
      headers: _headers,
      body: jsonEncode({
        'slug': slug,
        'mangaData': anime.toJson(),
      }),
    );
    return response.statusCode == 200;
  }

  // ─── USER HISTORY ──────────────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> getUserHistory(String googleId) async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.userHistory(googleId)}?limit=100');
    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      if (json['success'] == true && json['data'] != null) {
        final list = json['data'] as List;
        return list.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    }
    return [];
  }

  Future<void> saveHistory(
    String googleId, {
    required String slug,
    required String title,
    required String thumb,
    required String lastChapterTitle,
    required String lastChapterSlug,
    String type = 'anime',
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl${ApiEndpoints.userHistory(googleId)}');
      await _client.post(
        uri,
        headers: _headers,
        body: jsonEncode({
          'type': type,
          'slug': slug,
          'title': title,
          'thumb': thumb,
          'lastChapterTitle': lastChapterTitle,
          'lastChapterSlug': lastChapterSlug,
        }),
      );
    } catch (_) {
      // Background history tracking ignores network failures
    }
  }

  Future<void> clearHistory(String googleId) async {
    final uri = Uri.parse('$_baseUrl${ApiEndpoints.userHistory(googleId)}');
    await _client.delete(uri, headers: _headers);
  }
}
