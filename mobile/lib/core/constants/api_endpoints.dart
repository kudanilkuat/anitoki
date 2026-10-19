class ApiEndpoints {
  // Base URL default to anitoki.id production backend
  static const String defaultBaseUrl = 'https://anitoki.id';
  static const String fallbackLocalUrl = 'http://localhost:3000';

  // Current Application Version
  static const String currentAppVersion = '1.0.0';
  static const int currentAppBuildNumber = 1;

  // Firebase Configuration
  static const String firebaseApiKey = 'AIzaSyDtzcD-BTRHzXLxR46q-NLSczY1MkIwfRw';
  static const String firebaseProjectId = 'anitoki-id';
  static const String firebaseAuthDomain = 'anitoki-id.firebaseapp.com';

  // Endpoints
  static const String home = '/api/home';
  static const String animeList = '/api/anime-list';
  static const String genres = '/api/genres';
  static const String appVersion = '/api/app/version';
  static const String appAds = '/api/app/ads';

  // Detail & Stream
  static String animeDetail(String slug) => '/api/anime/$slug';
  static String episodeDetail(String animeSlug, String episodeSlug) =>
      '/api/episode/$animeSlug/$episodeSlug';

  // User & Auth
  static const String userSync = '/api/users/sync';
  static String userProfile(String googleId) => '/api/users/$googleId';
  static String userLibrary(String googleId) => '/api/users/$googleId/library';
  static String userHistory(String googleId) => '/api/users/$googleId/history';

  // Firebase Auth Identity Toolkit REST endpoints
  static const String firebaseSignInWithPassword =
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$firebaseApiKey';
  static const String firebaseSignUp =
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$firebaseApiKey';
  static const String firebaseSignInWithIdp =
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=$firebaseApiKey';
}
