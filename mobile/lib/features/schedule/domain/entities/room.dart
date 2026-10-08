import 'package:equatable/equatable.dart';

class Room extends Equatable {
  final int id;
  final int conferenceId;
  final String name;

  const Room({
    required this.id,
    required this.conferenceId,
    required this.name,
  });

  @override
  List<Object?> get props => [id, conferenceId, name];
}
