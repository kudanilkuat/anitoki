import 'anime_model.dart';

class EpisodeServer {
  final String name;
  final String url;
  final String type; // 'iframe' | 'mp4' | 'hls'

  EpisodeServer({
    required this.name,
    required this.url,
    this.type = 'iframe',
  });

  factory EpisodeServer.fromJson(Map<String, dynamic> json) {
    return EpisodeServer(
      name: json['name']?.toString() ?? 'Server',
      url: json['url']?.toString() ?? '',
      type: json['type']?.toString() ?? 'iframe',
    );
  }
}

class DownloadLink {
  final String name;
  final String url;

  DownloadLink({
    required this.name,
    required this.url,
  });

  factory DownloadLink.fromJson(Map<String, dynamic> json) {
    return DownloadLink(
      name: json['name']?.toString() ?? 'Mirror',
      url: json['url']?.toString() ?? '',
    );
  }
}

class DownloadQuality {
  final String quality;
  final String? size;
  final List<DownloadLink> links;

  DownloadQuality({
    required this.quality,
    this.size,
    this.links = const [],
  });

  factory DownloadQuality.fromJson(Map<String, dynamic> json) {
    var rawLinks = json['links'];
    List<DownloadLink> parsedLinks = [];
    if (rawLinks is List) {
      parsedLinks = rawLinks
          .map((l) => DownloadLink.fromJson(Map<String, dynamic>.from(l)))
          .toList();
    }

    return DownloadQuality(
      quality: json['quality']?.toString() ?? 'Quality',
      size: json['size']?.toString(),
      links: parsedLinks,
    );
  }
}

class EpisodeDetailData {
  final String title;
  final List<EpisodeServer> servers;
  final List<DownloadQuality> downloads;
  final int? episodeIndex;
  final String? createdAt;
  final String? prevSlug;
  final String? nextSlug;
  final AnimeItem? anime;
  final List<AnimeItem> recommendations;

  EpisodeDetailData({
    required this.title,
    this.servers = const [],
    this.downloads = const [],
    this.episodeIndex,
    this.createdAt,
    this.prevSlug,
    this.nextSlug,
    this.anime,
    this.recommendations = const [],
  });

  factory EpisodeDetailData.fromJson(Map<String, dynamic> json) {
    final epMap = json['episode'] ?? json['chapter'] ?? {};
    final navMap = json['navigation'] ?? {};
    final animeMap = json['anime'] ?? json['manga'];

    List<EpisodeServer> servers = [];
    if (epMap['servers'] is List) {
      servers = (epMap['servers'] as List)
          .map((s) => EpisodeServer.fromJson(Map<String, dynamic>.from(s)))
          .toList();
    }

    List<DownloadQuality> downloads = [];
    if (epMap['downloads'] is List) {
      downloads = (epMap['downloads'] as List)
          .map((d) => DownloadQuality.fromJson(Map<String, dynamic>.from(d)))
          .toList();
    }

    List<AnimeItem> recs = [];
    if (json['recommendations'] is List) {
      recs = (json['recommendations'] as List)
          .map((r) => AnimeItem.fromJson(Map<String, dynamic>.from(r)))
          .toList();
    }

    return EpisodeDetailData(
      title: epMap['title']?.toString() ?? 'Episode',
      servers: servers,
      downloads: downloads,
      episodeIndex: (epMap['episodeIndex'] as num?)?.toInt(),
      createdAt: epMap['createdAt']?.toString(),
      prevSlug: navMap['prev']?.toString(),
      nextSlug: navMap['next']?.toString(),
      anime: animeMap != null ? AnimeItem.fromJson(Map<String, dynamic>.from(animeMap)) : null,
      recommendations: recs,
    );
  }
}
