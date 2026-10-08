import 'package:equatable/equatable.dart';

class Conference extends Equatable {
  final int id;
  final String title;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final bool isCurrent;

  const Conference({
    required this.id,
    required this.title,
    this.startsAt,
    this.endsAt,
    this.isCurrent = false,
  });

  @override
  List<Object?> get props => [id, title, startsAt, endsAt, isCurrent];
}
