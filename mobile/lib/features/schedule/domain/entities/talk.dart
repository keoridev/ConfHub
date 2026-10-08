import 'package:equatable/equatable.dart';
import 'section.dart';
import 'room.dart';

class Talk extends Equatable {
  final int id;
  final int conferenceId;
  final String title;
  final String speakerName;
  final String? gradeOrGroup;
  final String? supervisor;
  final Section? section;
  final Room? room;
  final String abstractText;
  final List<String> tags;
  final String status;
  final DateTime? startTime;
  final DateTime? endTime;
  final DateTime? createdAt;

  const Talk({
    required this.id,
    required this.conferenceId,
    required this.title,
    required this.speakerName,
    this.gradeOrGroup,
    this.supervisor,
    this.section,
    this.room,
    required this.abstractText,
    this.tags = const [],
    this.status = 'approved',
    this.startTime,
    this.endTime,
    this.createdAt,
  });

  int get durationInMinutes {
    if (startTime != null && endTime != null) {
      return endTime!.difference(startTime!).inMinutes;
    }
    return 30; // default estimated duration
  }

  @override
  List<Object?> get props => [
        id,
        conferenceId,
        title,
        speakerName,
        gradeOrGroup,
        supervisor,
        section,
        room,
        abstractText,
        tags,
        status,
        startTime,
        endTime,
        createdAt,
      ];
}
