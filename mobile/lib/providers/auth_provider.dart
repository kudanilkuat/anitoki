import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService;
  final ApiService _apiService;

  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider({AuthService? authService, ApiService? apiService})
      : _authService = authService ?? AuthService(),
        _apiService = apiService ?? ApiService() {
    _initUser();
  }

  UserModel? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isPremium => _user?.isPremium ?? false;

  void _initUser() {
    _user = _authService.getCurrentUser();
    if (_user != null) {
      // Re-sync user info silently in the background
      refreshUser();
    }
  }

  Future<bool> signInWithGoogle({
    required String email,
    required String displayName,
    String photoUrl = '',
  }) async {
    _setLoading(true);
    _errorMessage = null;

    try {
      _user = await _authService.signInWithGoogleEmail(
        email: email,
        displayName: displayName,
        photoUrl: photoUrl,
      );
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  Future<bool> signInWithEmail({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _errorMessage = null;

    try {
      _user = await _authService.signInWithEmail(
        email: email,
        password: password,
      );
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  Future<bool> registerWithEmail({
    required String email,
    required String password,
    required String name,
  }) async {
    _setLoading(true);
    _errorMessage = null;

    try {
      _user = await _authService.registerWithEmail(
        email: email,
        password: password,
        name: name,
      );
      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshUser() async {
    if (_user == null) return;
    try {
      final updated = await _apiService.syncUser(
        googleId: _user!.googleId,
        email: _user!.email,
        displayName: _user!.displayName,
        photoUrl: _user!.photoUrl,
      );
      _user = updated;
      notifyListeners();
    } catch (_) {
      // Ignore background sync errors
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void _setLoading(bool val) {
    _isLoading = val;
    notifyListeners();
  }
}
