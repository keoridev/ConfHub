import '../../domain/entities/conference.dart';
import '../../../../core/utils/date_formatter.dart';

class ConferenceModel extends Conference {
  const ConferenceModel({
    required super.id,
    required super.title,
    super.startsAt,
    super.endsAt,
    super.isCurrent,
  });

  factory ConferenceModel.fromJson(Map<String, dynamic> json) {
    return ConferenceModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '1') ?? 1,
      title: json['title'] as String? ?? 'Студенческая конференция ConfHub 2026',
      startsAt: DateFormatter.parseIso(json['startsAt'] as String?),
      endsAt: DateFormatter.parseIso(json['endsAt'] as String?),
      isCurrent: json['isCurrent'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'startsAt': startsAt?.toIso8601String(),
      'endsAt': endsAt?.toIso8601String(),
      'isCurrent': isCurrent,
    };
  }
}
