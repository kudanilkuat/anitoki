import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_endpoints.dart';
import '../models/user_model.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final ApiService _apiService;
  final http.Client _client;

  AuthService({ApiService? apiService, http.Client? client})
      : _apiService = apiService ?? ApiService(),
        _client = client ?? http.Client();

  // ─── LOGIN DENGAN GOOGLE (FIREBASE AUTH) ──────────────────────────────────
  Future<UserModel> signInWithGoogleEmail({
    required String email,
    required String displayName,
    String photoUrl = '',
  }) async {
    // Generate deterministic or safe UID based on email for Firebase compatibility
    final cleanUid = 'google_${email.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}';

    // Sinkronisasi langsung ke backend anitoki.id
    final user = await _apiService.syncUser(
      googleId: cleanUid,
      email: email,
      displayName: displayName.isNotEmpty ? displayName : email.split('@').first,
      photoUrl: photoUrl.isNotEmpty
          ? photoUrl
          : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(displayName)}&background=E97991&color=fff',
    );

    await StorageService.saveUser(user, token: cleanUid);
    return user;
  }

  // ─── LOGIN DENGAN EMAIL & PASSWORD (FIREBASE IDENTITY TOOLKIT) ───────────
  Future<UserModel> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse(ApiEndpoints.firebaseSignInWithPassword);
    final response = await _client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email.trim(),
        'password': password,
        'returnSecureToken': true,
      }),
    );

    final json = jsonDecode(response.body);

    if (response.statusCode == 200 && json['localId'] != null) {
      final String uid = json['localId'];
      final String userEmail = json['email'] ?? email;
      final String displayName = json['displayName'] ?? userEmail.split('@').first;
      final String idToken = json['idToken'] ?? uid;

      // Sinkronkan ke database Anitoki MongoDB melalui backend anitoki.id
      final user = await _apiService.syncUser(
        googleId: uid,
        email: userEmail,
        displayName: displayName,
        photoUrl: 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(displayName)}&background=E97991&color=fff',
      );

      await StorageService.saveUser(user, token: idToken);
      return user;
    } else {
      final errorMsg = json['error']?['message'] ?? 'Email atau password salah';
      if (errorMsg.toString().contains('EMAIL_NOT_FOUND') ||
          errorMsg.toString().contains('INVALID_PASSWORD') ||
          errorMsg.toString().contains('INVALID_LOGIN_CREDENTIALS')) {
        throw Exception('Email atau password tidak cocok.');
      } else if (errorMsg.toString().contains('USER_DISABLED')) {
        throw Exception('Akun telah dinonaktifkan.');
      }
      throw Exception(errorMsg);
    }
  }

  // ─── DAFTAR AKUN BARU (FIREBASE IDENTITY TOOLKIT) ────────────────────────
  Future<UserModel> registerWithEmail({
    required String email,
    required String password,
    required String name,
  }) async {
    final uri = Uri.parse(ApiEndpoints.firebaseSignUp);
    final response = await _client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email.trim(),
        'password': password,
        'returnSecureToken': true,
      }),
    );

    final json = jsonDecode(response.body);

    if (response.statusCode == 200 && json['localId'] != null) {
      final String uid = json['localId'];
      final String userEmail = json['email'] ?? email;
      final String displayName = name.trim().isNotEmpty ? name.trim() : userEmail.split('@').first;
      final String idToken = json['idToken'] ?? uid;

      // Sinkronkan user baru ke MongoDB anitoki.id
      final user = await _apiService.syncUser(
        googleId: uid,
        email: userEmail,
        displayName: displayName,
        photoUrl: 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(displayName)}&background=E97991&color=fff',
      );

      await StorageService.saveUser(user, token: idToken);
      return user;
    } else {
      final errorMsg = json['error']?['message'] ?? 'Gagal mendaftar';
      if (errorMsg.toString().contains('EMAIL_EXISTS')) {
        throw Exception('Email ini sudah terdaftar. Silakan login.');
      } else if (errorMsg.toString().contains('WEAK_PASSWORD')) {
        throw Exception('Password minimal 6 karakter.');
      }
      throw Exception(errorMsg);
    }
  }

  // ─── LOGOUT ──────────────────────────────────────────────────────────────
  Future<void> logout() async {
    await StorageService.clearUser();
  }

  // ─── CEK USER LOGIN DARI STORAGE ─────────────────────────────────────────
  UserModel? getCurrentUser() {
    return StorageService.getUser();
  }
}
