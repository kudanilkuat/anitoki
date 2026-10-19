class GenreModel {
  final String name;
  final int count;

  GenreModel({
    required this.name,
    this.count = 0,
  });

  factory GenreModel.fromJson(Map<String, dynamic> json) {
    return GenreModel(
      name: json['name']?.toString() ?? '',
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }
}
