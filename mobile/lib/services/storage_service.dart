import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../core/constants/api_endpoints.dart';

class StorageService {
  static const String _keyUser = 'anitoki_saved_user';
  static const String _keyToken = 'anitoki_auth_token';
  static const String _keyBaseUrl = 'anitoki_base_url';
  static const String _keyBookmarks = 'anitoki_local_bookmarks';
  static const String _keyHistory = 'anitoki_local_history';

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Base URL
  static String getBaseUrl() {
    return _prefs?.getString(_keyBaseUrl) ?? ApiEndpoints.defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    await _prefs?.setString(_keyBaseUrl, url);
  }

  // User session
  static Future<void> saveUser(UserModel user, {String? token}) async {
    await _prefs?.setString(_keyUser, jsonEncode(user.toJson()));
    if (token != null) {
      await _prefs?.setString(_keyToken, token);
    }
  }

  static UserModel? getUser() {
    final raw = _prefs?.getString(_keyUser);
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw);
      return UserModel.fromJson(Map<String, dynamic>.from(map));
    } catch (_) {
      return null;
    }
  }

  static String? getToken() {
    return _prefs?.getString(_keyToken);
  }

  static Future<void> clearUser() async {
    await _prefs?.remove(_keyUser);
    await _prefs?.remove(_keyToken);
  }

  // Local Bookmarks cache
  static List<Map<String, dynamic>> getLocalBookmarks() {
    final raw = _prefs?.getString(_keyBookmarks);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveLocalBookmarks(List<Map<String, dynamic>> items) async {
    await _prefs?.setString(_keyBookmarks, jsonEncode(items));
  }

  // Local Watch History cache
  static List<Map<String, dynamic>> getLocalHistory() {
    final raw = _prefs?.getString(_keyHistory);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveLocalHistory(List<Map<String, dynamic>> items) async {
    await _prefs?.setString(_keyHistory, jsonEncode(items));
  }
}
