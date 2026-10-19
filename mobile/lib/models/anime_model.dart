class EpisodeSummary {
  final String title;
  final String slug;
  final String? airDate;

  EpisodeSummary({
    required this.title,
    required this.slug,
    this.airDate,
  });

  factory EpisodeSummary.fromJson(Map<String, dynamic> json) {
    return EpisodeSummary(
      title: json['title']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      airDate: json['airDate']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'title': title,
        'slug': slug,
        'airDate': airDate,
      };
}

class AnimeItem {
  final String id;
  final String title;
  final String slug;
  final String coverImage;
  final String? type;
  final String? status;
  final double rating;
  final int views;
  final String? lastUpdated;
  final int episodeCount;
  final String? lastEpisode;
  final String? lastEpisodeSlug;
  final List<EpisodeSummary> episodes;

  AnimeItem({
    required this.id,
    required this.title,
    required this.slug,
    required this.coverImage,
    this.type,
    this.status,
    this.rating = 0.0,
    this.views = 0,
    this.lastUpdated,
    this.episodeCount = 0,
    this.lastEpisode,
    this.lastEpisodeSlug,
    this.episodes = const [],
  });

  factory AnimeItem.fromJson(Map<String, dynamic> json) {
    var rawEpisodes = json['episodes'];
    List<EpisodeSummary> parsedEpisodes = [];
    if (rawEpisodes is List) {
      parsedEpisodes = rawEpisodes
          .map((e) => EpisodeSummary.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }

    double parsedRating = 0.0;
    if (json['rating'] != null) {
      if (json['rating'] is num) {
        parsedRating = (json['rating'] as num).toDouble();
      } else if (json['rating'] is String) {
        parsedRating = double.tryParse(json['rating']) ?? 0.0;
      }
    }

    return AnimeItem(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      coverImage: json['coverImage']?.toString() ?? '',
      type: json['type']?.toString(),
      status: json['status']?.toString(),
      rating: parsedRating,
      views: (json['views'] as num?)?.toInt() ?? 0,
      lastUpdated: json['lastUpdated']?.toString(),
      episodeCount: (json['episode_count'] as num?)?.toInt() ?? parsedEpisodes.length,
      lastEpisode: json['last_episode']?.toString(),
      lastEpisodeSlug: json['last_episode_slug']?.toString(),
      episodes: parsedEpisodes,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'title': title,
        'slug': slug,
        'coverImage': coverImage,
        'type': type,
        'status': status,
        'rating': rating,
        'views': views,
        'lastUpdated': lastUpdated,
        'episode_count': episodeCount,
        'last_episode': lastEpisode,
        'last_episode_slug': lastEpisodeSlug,
        'episodes': episodes.map((e) => e.toJson()).toList(),
      };
}

class AnimeDetailInfo extends AnimeItem {
  final String? synopsis;
  final List<String> genres;
  final String? nativeTitle;
  final String? airDate;
  final String? producer;
  final String? studio;
  final String? duration;
  final dynamic totalEpisode;

  AnimeDetailInfo({
    required super.id,
    required super.title,
    required super.slug,
    required super.coverImage,
    super.type,
    super.status,
    super.rating,
    super.views,
    super.lastUpdated,
    super.episodeCount,
    super.lastEpisode,
    super.lastEpisodeSlug,
    super.episodes,
    this.synopsis,
    this.genres = const [],
    this.nativeTitle,
    this.airDate,
    this.producer,
    this.studio,
    this.duration,
    this.totalEpisode,
  });

  factory AnimeDetailInfo.fromJson(Map<String, dynamic> json) {
    final base = AnimeItem.fromJson(json);

    List<String> parsedGenres = [];
    if (json['genres'] is List) {
      parsedGenres = (json['genres'] as List).map((g) => g.toString()).toList();
    }

    return AnimeDetailInfo(
      id: base.id,
      title: base.title,
      slug: base.slug,
      coverImage: base.coverImage,
      type: base.type,
      status: base.status,
      rating: base.rating,
      views: base.views,
      lastUpdated: base.lastUpdated,
      episodeCount: base.episodeCount,
      lastEpisode: base.lastEpisode,
      lastEpisodeSlug: base.lastEpisodeSlug,
      episodes: base.episodes,
      synopsis: json['synopsis']?.toString(),
      genres: parsedGenres,
      nativeTitle: json['nativeTitle']?.toString(),
      airDate: json['airDate']?.toString(),
      producer: json['producer']?.toString(),
      studio: json['studio']?.toString(),
      duration: json['duration']?.toString(),
      totalEpisode: json['totalEpisode'],
    );
  }
}
