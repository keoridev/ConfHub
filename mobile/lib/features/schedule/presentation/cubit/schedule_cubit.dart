import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../domain/entities/section.dart';
import '../../domain/entities/room.dart';
import '../../domain/entities/talk.dart';
import '../../domain/repositories/schedule_repository.dart';
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
  final DioClient dioClient;
  final ScheduleRepository scheduleRepository;

  ScheduleCubit({
    required this.getCurrentConference,
    required this.getSections,
    required this.getRooms,
    required this.getTalks,
    required this.localStorageService,
    required this.dioClient,
    required this.scheduleRepository,
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
          isBackendOnline: scheduleRepository.isBackendConnected,
          serverUrl: dioClient.currentBaseUrl,
          currentTime: DateTime.now(),
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
            isBackendOnline: scheduleRepository.isBackendConnected,
            serverUrl: dioClient.currentBaseUrl,
            currentTime: DateTime.now(),
          ));
        },
      );
    } else {
      await loadSchedule();
    }
  }

  /// Called periodically by timer to update real-time clocks and countdowns
  void updateCurrentTime() {
    if (state is! ScheduleLoaded) return;
    final currentState = state as ScheduleLoaded;
    emit(currentState.copyWith(currentTime: DateTime.now()));
  }

  /// Change server URL and immediately test / reconnect
  Future<void> changeServerUrl(String newBaseUrl) async {
    dioClient.setBaseUrl(newBaseUrl);
    await loadSchedule();
  }

  Future<bool> checkServerHealth([String? testUrl]) async {
    return dioClient.checkHealth(testUrl);
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
