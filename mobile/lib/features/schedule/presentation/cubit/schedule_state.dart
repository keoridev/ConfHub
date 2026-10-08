import 'package:equatable/equatable.dart';
import '../../domain/entities/conference.dart';
import '../../domain/entities/section.dart';
import '../../domain/entities/room.dart';
import '../../domain/entities/talk.dart';

enum ScheduleTimeFilter {
  all,
  liveAndSoon,
  morning,
  afternoon,
}

abstract class ScheduleState extends Equatable {
  const ScheduleState();

  @override
  List<Object?> get props => [];
}

class ScheduleInitial extends ScheduleState {}

class ScheduleLoading extends ScheduleState {}

class ScheduleLoaded extends ScheduleState {
  final Conference conference;
  final List<Talk> talks;
  final List<Section> sections;
  final List<Room> rooms;
  final int? selectedSectionId;
  final String searchQuery;
  final bool filterByPreferencesOnly;
  final List<String> preferredTopics;
  final ScheduleTimeFilter timeFilter;
  final Set<int> bookmarkedTalkIds;

  const ScheduleLoaded({
    required this.conference,
    required this.talks,
    required this.sections,
    required this.rooms,
    this.selectedSectionId,
    this.searchQuery = '',
    this.filterByPreferencesOnly = false,
    this.preferredTopics = const [],
    this.timeFilter = ScheduleTimeFilter.all,
    this.bookmarkedTalkIds = const {},
  });

  /// Filtered list based on section, query, time filter, and preferences
  List<Talk> get visibleTalks {
    return talks.where((talk) {
      // 1. Section filter
      if (selectedSectionId != null && talk.section?.id != selectedSectionId) {
        return false;
      }

      // 2. Preferences filter
      if (filterByPreferencesOnly && preferredTopics.isNotEmpty) {
        final matchesSection = preferredTopics.any((topic) =>
            talk.section?.title.toLowerCase().contains(topic.toLowerCase()) ?? false);
        final matchesTag = talk.tags.any((tag) =>
            preferredTopics.any((topic) => topic.toLowerCase().contains(tag.toLowerCase())));
        if (!matchesSection && !matchesTag) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim().isNotEmpty) {
        final q = searchQuery.toLowerCase();
        final matches = talk.title.toLowerCase().contains(q) ||
            talk.speakerName.toLowerCase().contains(q) ||
            (talk.room?.name.toLowerCase().contains(q) ?? false) ||
            talk.tags.any((t) => t.toLowerCase().contains(q));
        if (!matches) return false;
      }

      // 4. Time filter
      final now = DateTime.now();
      if (timeFilter == ScheduleTimeFilter.liveAndSoon && talk.startTime != null) {
        final start = talk.startTime!.toLocal();
        final end = talk.endTime?.toLocal() ?? start.add(const Duration(minutes: 45));
        final isLive = now.isAfter(start) && now.isBefore(end);
        final isSoon = start.isAfter(now) && start.difference(now).inMinutes <= 30;
        if (!isLive && !isSoon) return false;
      } else if (timeFilter == ScheduleTimeFilter.morning && talk.startTime != null) {
        if (talk.startTime!.toLocal().hour >= 13) return false;
      } else if (timeFilter == ScheduleTimeFilter.afternoon && talk.startTime != null) {
        if (talk.startTime!.toLocal().hour < 13) return false;
      }

      return true;
    }).toList();
  }

  /// Talk happening right now or next upcoming
  Talk? get currentOrNextTalk {
    final now = DateTime.now();
    for (final talk in talks) {
      if (talk.startTime == null) continue;
      final start = talk.startTime!.toLocal();
      final end = talk.endTime?.toLocal() ?? start.add(const Duration(minutes: 45));
      if (now.isAfter(start) && now.isBefore(end)) return talk;
    }
    for (final talk in talks) {
      if (talk.startTime == null) continue;
      if (talk.startTime!.toLocal().isAfter(now)) return talk;
    }
    return talks.isNotEmpty ? talks.first : null;
  }

  ScheduleLoaded copyWith({
    Conference? conference,
    List<Talk>? talks,
    List<Section>? sections,
    List<Room>? rooms,
    int? selectedSectionId,
    bool resetSection = false,
    String? searchQuery,
    bool? filterByPreferencesOnly,
    List<String>? preferredTopics,
    ScheduleTimeFilter? timeFilter,
    Set<int>? bookmarkedTalkIds,
  }) {
    return ScheduleLoaded(
      conference: conference ?? this.conference,
      talks: talks ?? this.talks,
      sections: sections ?? this.sections,
      rooms: rooms ?? this.rooms,
      selectedSectionId: resetSection ? null : (selectedSectionId ?? this.selectedSectionId),
      searchQuery: searchQuery ?? this.searchQuery,
      filterByPreferencesOnly: filterByPreferencesOnly ?? this.filterByPreferencesOnly,
      preferredTopics: preferredTopics ?? this.preferredTopics,
      timeFilter: timeFilter ?? this.timeFilter,
      bookmarkedTalkIds: bookmarkedTalkIds ?? this.bookmarkedTalkIds,
    );
  }

  @override
  List<Object?> get props => [
        conference,
        talks,
        sections,
        rooms,
        selectedSectionId,
        searchQuery,
        filterByPreferencesOnly,
        preferredTopics,
        timeFilter,
        bookmarkedTalkIds,
      ];
}

class ScheduleError extends ScheduleState {
  final String message;

  const ScheduleError({required this.message});

  @override
  List<Object?> get props => [message];
}
