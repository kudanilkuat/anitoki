class UserModel {
  final String googleId;
  final String email;
  final String displayName;
  final String photoUrl;
  final bool isAdmin;
  final bool isPremium;
  final String? premiumUntil;
  final String? bio;
  final int totalReadingMinutes;
  final int downloadCount;

  UserModel({
    required this.googleId,
    required this.email,
    required this.displayName,
    this.photoUrl = '',
    this.isAdmin = false,
    this.isPremium = false,
    this.premiumUntil,
    this.bio,
    this.totalReadingMinutes = 0,
    this.downloadCount = 0,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      googleId: json['googleId']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      displayName: json['displayName']?.toString() ?? 'Pengguna Anitoki',
      photoUrl: json['photoURL']?.toString() ?? json['photoUrl']?.toString() ?? '',
      isAdmin: json['isAdmin'] == true,
      isPremium: json['isPremium'] == true,
      premiumUntil: json['premiumUntil']?.toString(),
      bio: json['bio']?.toString(),
      totalReadingMinutes: (json['totalReadingMinutes'] as num?)?.toInt() ?? 0,
      downloadCount: (json['downloadCount'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'googleId': googleId,
        'email': email,
        'displayName': displayName,
        'photoURL': photoUrl,
        'isAdmin': isAdmin,
        'isPremium': isPremium,
        'premiumUntil': premiumUntil,
        'bio': bio,
        'totalReadingMinutes': totalReadingMinutes,
        'downloadCount': downloadCount,
      };

  UserModel copyWith({
    String? displayName,
    String? photoUrl,
    String? bio,
    bool? isPremium,
    String? premiumUntil,
    int? totalReadingMinutes,
  }) {
    return UserModel(
      googleId: googleId,
      email: email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      isAdmin: isAdmin,
      isPremium: isPremium ?? this.isPremium,
      premiumUntil: premiumUntil ?? this.premiumUntil,
      bio: bio ?? this.bio,
      totalReadingMinutes: totalReadingMinutes ?? this.totalReadingMinutes,
      downloadCount: downloadCount,
    );
  }
}
