import 'package:equatable/equatable.dart';
import '../../domain/entities/talk.dart';
import '../../../../core/utils/time_status_helper.dart';

abstract class TalkDetailState extends Equatable {
  const TalkDetailState();

  @override
  List<Object?> get props => [];
}

class TalkDetailInitial extends TalkDetailState {}

class TalkDetailLoading extends TalkDetailState {}

class TalkDetailLoaded extends TalkDetailState {
  final Talk talk;
  final bool isBookmarked;
  final String selectedStartLocation;
  final int walkingMinutes;
  final CommuteEstimate commuteEstimate;

  const TalkDetailLoaded({
    required this.talk,
    required this.isBookmarked,
    this.selectedStartLocation = '1-й этаж (Главный вход / Гардероб)',
    this.walkingMinutes = 4,
    required this.commuteEstimate,
  });

  TalkDetailLoaded copyWith({
    Talk? talk,
    bool? isBookmarked,
    String? selectedStartLocation,
    int? walkingMinutes,
    CommuteEstimate? commuteEstimate,
  }) {
    return TalkDetailLoaded(
      talk: talk ?? this.talk,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      selectedStartLocation: selectedStartLocation ?? this.selectedStartLocation,
      walkingMinutes: walkingMinutes ?? this.walkingMinutes,
      commuteEstimate: commuteEstimate ?? this.commuteEstimate,
    );
  }

  @override
  List<Object?> get props => [
        talk,
        isBookmarked,
        selectedStartLocation,
        walkingMinutes,
        commuteEstimate,
      ];
}

class TalkDetailError extends TalkDetailState {
  final String message;

  const TalkDetailError({required this.message});

  @override
  List<Object?> get props => [message];
}
