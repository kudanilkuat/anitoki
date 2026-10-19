class AppVersionModel {
  final String latestVersion;
  final int latestBuildNumber;
  final bool forceUpdate;
  final String updateUrl;
  final String message;
  final String title;
  final List<String> whatsNew;

  AppVersionModel({
    required this.latestVersion,
    required this.latestBuildNumber,
    this.forceUpdate = false,
    required this.updateUrl,
    required this.message,
    this.title = 'Update Tersedia 🎉',
    this.whatsNew = const [],
  });

  factory AppVersionModel.fromJson(Map<String, dynamic> json) {
    List<String> newItems = [];
    if (json['whatsNew'] is List) {
      newItems = (json['whatsNew'] as List).map((e) => e.toString()).toList();
    }

    return AppVersionModel(
      latestVersion: json['latestVersion']?.toString() ?? '1.0.0',
      latestBuildNumber: (json['latestBuildNumber'] as num?)?.toInt() ?? 1,
      forceUpdate: json['forceUpdate'] == true,
      updateUrl: json['updateUrl']?.toString() ?? 'https://anitoki.id',
      message: json['message']?.toString() ?? 'Versi baru Anitoki telah tersedia.',
      title: json['title']?.toString() ?? 'Update Tersedia 🎉',
      whatsNew: newItems,
    );
  }
}
