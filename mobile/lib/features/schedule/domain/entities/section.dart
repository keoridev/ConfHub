import 'package:equatable/equatable.dart';

class Section extends Equatable {
  final int id;
  final int conferenceId;
  final String title;
  final int sortOrder;
  final String? supervisor;

  const Section({
    required this.id,
    required this.conferenceId,
    required this.title,
    this.sortOrder = 0,
    this.supervisor,
  });

  @override
  List<Object?> get props => [id, conferenceId, title, sortOrder, supervisor];
}
