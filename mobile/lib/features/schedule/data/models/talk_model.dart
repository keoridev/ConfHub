import '../../domain/entities/talk.dart';
import '../../../../core/utils/date_formatter.dart';
import 'section_model.dart';
import 'room_model.dart';

class TalkModel extends Talk {
  const TalkModel({
    required super.id,
    required super.conferenceId,
    required super.title,
    required super.speakerName,
    super.gradeOrGroup,
    super.supervisor,
    super.section,
    super.room,
    required super.abstractText,
    super.tags,
    super.status,
    super.startTime,
    super.endTime,
    super.createdAt,
  });

  factory TalkModel.fromJson(Map<String, dynamic> json) {
    SectionModel? parsedSection;
    if (json['section'] != null && json['section'] is Map<String, dynamic>) {
      parsedSection = SectionModel.fromJson(json['section'] as Map<String, dynamic>);
    }

    RoomModel? parsedRoom;
    if (json['room'] != null && json['room'] is Map<String, dynamic>) {
      parsedRoom = RoomModel.fromJson(json['room'] as Map<String, dynamic>);
    }

    List<String> parsedTags = [];
    if (json['tags'] is List) {
      parsedTags = (json['tags'] as List).map((e) => e.toString()).toList();
    }

    return TalkModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      conferenceId: json['conferenceId'] is int
          ? json['conferenceId'] as int
          : int.tryParse(json['conferenceId']?.toString() ?? '1') ?? 1,
      title: json['title'] as String? ?? 'Без названия',
      speakerName: json['speakerName'] as String? ?? 'Докладчик',
      gradeOrGroup: json['gradeOrGroup'] as String?,
      supervisor: json['supervisor'] as String?,
      section: parsedSection,
      room: parsedRoom,
      abstractText: json['abstract'] as String? ?? '',
      tags: parsedTags,
      status: json['status'] as String? ?? 'approved',
      startTime: DateFormatter.parseIso(json['startTime'] as String?),
      endTime: DateFormatter.parseIso(json['endTime'] as String?),
      createdAt: DateFormatter.parseIso(json['createdAt'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conferenceId': conferenceId,
      'title': title,
      'speakerName': speakerName,
      'gradeOrGroup': gradeOrGroup,
      'supervisor': supervisor,
      'section': section is SectionModel ? (section as SectionModel).toJson() : null,
      'room': room is RoomModel ? (room as RoomModel).toJson() : null,
      'abstract': abstractText,
      'tags': tags,
      'status': status,
      'startTime': startTime?.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
