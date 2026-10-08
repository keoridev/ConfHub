import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../domain/entities/section.dart';
import '../../domain/entities/room.dart';
import '../../domain/entities/talk.dart';
import '../../domain/usecases/get_current_conference.dart';
import '../../domain/usecases/get_sections.dart';
import '../../domain/usecases/get_rooms.dart';
import '../../domain/usecases/get_talks.dart';
import 'schedule_state.dart';

class ScheduleCubit extends Cubit<ScheduleState> {
  final GetCurrentConference getCurrentConference;
  final GetSections getSections;
  final GetRooms getRooms;
  final GetTalks getTalks;
  final LocalStorageService localStorageService;

  ScheduleCubit({
    required this.getCurrentConference,
    required this.getSections,
    required this.getRooms,
    required this.getTalks,
    required this.localStorageService,
  }) : super(ScheduleInitial());

  Future<void> loadSchedule() async {
    emit(ScheduleLoading());

    // 1. Fetch current conference
    final confResult = await getCurrentConference();

    await confResult.fold(
      (failure) async {
        emit(ScheduleError(message: failure.message));
      },
      (conference) async {
        // 2. Concurrently fetch sections, rooms and talks
        final sectionsResult = await getSections(conferenceId: conference.id);
        final roomsResult = await getRooms(conferenceId: conference.id);
        final talksResult = await getTalks(conferenceId: conference.id);

        final sections = sectionsResult.getOrElse((_) => <Section>[]);
        final rooms = roomsResult.getOrElse((_) => <Room>[]);
        final talks = talksResult.getOrElse((_) => <Talk>[]);

        final savedTopics = localStorageService.selectedTopics;
        final bookmarkedIds = localStorageService.bookmarkedTalkIds.toSet();

        emit(ScheduleLoaded(
          conference: conference,
          talks: talks,
          sections: sections,
          rooms: rooms,
          preferredTopics: savedTopics,
          bookmarkedTalkIds: bookmarkedIds,
          filterByPreferencesOnly: false,
        ));
      },
    );
  }

  Future<void> refresh() async {
    if (state is ScheduleLoaded) {
      final currentState = state as ScheduleLoaded;
      final talksResult = await getTalks(
        conferenceId: currentState.conference.id,
        sectionId: currentState.selectedSectionId,
      );

      talksResult.fold(
        (failure) {},
        (newTalks) {
          final bookmarkedIds = localStorageService.bookmarkedTalkIds.toSet();
          final savedTopics = localStorageService.selectedTopics;
          emit(currentState.copyWith(
            talks: newTalks,
            preferredTopics: savedTopics,
            bookmarkedTalkIds: bookmarkedIds,
          ));
        },
      );
    } else {
      await loadSchedule();
    }
  }

  void selectSection(int? sectionId) {
    if (state is! ScheduleLoaded) return;
    final currentState = state as ScheduleLoaded;
    if (currentState.selectedSectionId == sectionId) {
      emit(currentState.copyWith(resetSection: true));
    } else {
      emit(currentState.copyWith(selectedSectionId: sectionId));
    }
  }

  void setSearchQuery(String query) {
    if (state is! ScheduleLoaded) return;
    emit((state as ScheduleLoaded).copyWith(searchQuery: query));
  }

  void togglePreferencesFilter() {
    if (state is! ScheduleLoaded) return;
    final currentState = state as ScheduleLoaded;
    emit(currentState.copyWith(
      filterByPreferencesOnly: !currentState.filterByPreferencesOnly,
    ));
  }

  void setTimeFilter(ScheduleTimeFilter filter) {
    if (state is! ScheduleLoaded) return;
    emit((state as ScheduleLoaded).copyWith(timeFilter: filter));
  }

  Future<void> toggleBookmark(int talkId) async {
    if (state is! ScheduleLoaded) return;
    final currentState = state as ScheduleLoaded;
    await localStorageService.toggleBookmark(talkId);
    final updated = localStorageService.bookmarkedTalkIds.toSet();
    emit(currentState.copyWith(bookmarkedTalkIds: updated));
  }

  void reloadPreferences() {
    if (state is! ScheduleLoaded) return;
    final currentState = state as ScheduleLoaded;
    final savedTopics = localStorageService.selectedTopics;
    emit(currentState.copyWith(preferredTopics: savedTopics));
  }
}
