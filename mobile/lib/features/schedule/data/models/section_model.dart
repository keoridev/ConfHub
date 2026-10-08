import '../../domain/entities/section.dart';

class SectionModel extends Section {
  const SectionModel({
    required super.id,
    required super.conferenceId,
    required super.title,
    super.sortOrder,
  });

  factory SectionModel.fromJson(Map<String, dynamic> json) {
    return SectionModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      conferenceId: json['conferenceId'] is int
          ? json['conferenceId'] as int
          : int.tryParse(json['conferenceId']?.toString() ?? '1') ?? 1,
      title: json['title'] as String? ?? 'Секция',
      sortOrder: json['sortOrder'] is int
          ? json['sortOrder'] as int
          : int.tryParse(json['sortOrder']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conferenceId': conferenceId,
      'title': title,
      'sortOrder': sortOrder,
    };
  }
}
