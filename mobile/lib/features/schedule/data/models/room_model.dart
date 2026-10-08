import '../../domain/entities/room.dart';

class RoomModel extends Room {
  const RoomModel({
    required super.id,
    required super.conferenceId,
    required super.name,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) {
    return RoomModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      conferenceId: json['conferenceId'] is int
          ? json['conferenceId'] as int
          : int.tryParse(json['conferenceId']?.toString() ?? '1') ?? 1,
      name: json['name'] as String? ?? 'Аудитория',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conferenceId': conferenceId,
      'name': name,
    };
  }
}
