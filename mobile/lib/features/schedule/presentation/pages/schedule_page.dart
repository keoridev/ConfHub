import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/conf_empty_state.dart';
import '../../../onboarding/presentation/cubit/onboarding_cubit.dart';
import '../../../onboarding/presentation/widgets/topic_preference_sheet.dart';
import '../../domain/entities/talk.dart';
import '../cubit/schedule_cubit.dart';
import '../cubit/schedule_state.dart';
import '../widgets/schedule_search_bar.dart';
import '../widgets/schedule_shimmer.dart';
import '../widgets/section_filter_bar.dart';
import '../widgets/talk_card.dart';
import '../widgets/time_banner.dart';
import 'talk_detail_page.dart';

class SchedulePage extends StatefulWidget {
  const SchedulePage({super.key});

  @override
  State<SchedulePage> createState() => _SchedulePageState();
}

class _SchedulePageState extends State<SchedulePage> {
  int _selectedNavTab = 0; // 0: Schedule, 1: Bookmarks, 2: Info/Rooms
  bool _hasCheckedOnboarding = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ScheduleCubit>().loadSchedule();
      _checkOnboardingPrompt();
    });
  }

  void _checkOnboardingPrompt() {
    final onboardingCubit = context.read<OnboardingCubit>();
    onboardingCubit.checkStatus();

    // If first launch, politely show topic preference bottom sheet
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      if (onboardingCubit.state.shouldShowPrompt && !_hasCheckedOnboarding) {
        _hasCheckedOnboarding = true;
        TopicPreferenceSheet.show(
          context,
          onCompleted: () {
            context.read<ScheduleCubit>().reloadPreferences();
          },
        );
      }
    });
  }

  void _openTalkDetails(Talk talk) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TalkDetailPage(talk: talk),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.hub_rounded,
                color: AppColors.accent,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'ConfHub',
                    style: AppTypography.titleLarge.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'Гид для посетителей',
                    style: AppTypography.bodySmall.copyWith(
                      fontSize: 11,
                      color: AppColors.textMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Мои темы',
            icon: const Icon(Icons.tune_rounded, color: AppColors.primary),
            onPressed: () {
              TopicPreferenceSheet.show(
                context,
                onCompleted: () {
                  context.read<ScheduleCubit>().reloadPreferences();
                },
              );
            },
          ),
          IconButton(
            tooltip: 'Обновить',
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () => context.read<ScheduleCubit>().refresh(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: BlocConsumer<ScheduleCubit, ScheduleState>(
        listener: (context, state) {
          if (state is ScheduleLoaded) {
            // Update available topics in onboarding from actual backend sections
            final sectionTitles = state.sections.map((s) => s.title).toList();
            if (sectionTitles.isNotEmpty) {
              context.read<OnboardingCubit>().updateAvailableTopics(sectionTitles);
            }
          }
        },
        builder: (context, state) {
          if (state is ScheduleLoading) {
            return const ScheduleShimmer();
          }

          if (state is ScheduleError) {
            return ConfEmptyState(
              icon: Icons.cloud_off_rounded,
              title: 'Ошибка загрузки расписания',
              message: state.message,
              buttonText: 'Повторить попытку',
              onButtonPressed: () => context.read<ScheduleCubit>().loadSchedule(),
            );
          }

          if (state is ScheduleLoaded) {
            return _buildLoadedContent(state);
          }

          return const SizedBox.shrink();
        },
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border, width: 1)),
        ),
        child: NavigationBar(
          selectedIndex: _selectedNavTab,
          onDestinationSelected: (index) {
            setState(() => _selectedNavTab = index);
          },
          backgroundColor: AppColors.surface,
          indicatorColor: AppColors.secondaryLight,
          elevation: 0,
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.calendar_month_outlined, color: AppColors.textMuted),
              selectedIcon: Icon(Icons.calendar_month_rounded, color: AppColors.primary),
              label: 'Программа',
            ),
            NavigationDestination(
              icon: BlocBuilder<ScheduleCubit, ScheduleState>(
                builder: (context, state) {
                  final count = (state is ScheduleLoaded) ? state.bookmarkedTalkIds.length : 0;
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text('$count'),
                    backgroundColor: AppColors.accent,
                    textColor: AppColors.primaryDark,
                    child: const Icon(Icons.bookmark_outline_rounded, color: AppColors.textMuted),
                  );
                },
              ),
              selectedIcon: const Icon(Icons.bookmark_rounded, color: AppColors.primary),
              label: 'Избранное',
            ),
            const NavigationDestination(
              icon: Icon(Icons.meeting_room_outlined, color: AppColors.textMuted),
              selectedIcon: Icon(Icons.meeting_room_rounded, color: AppColors.primary),
              label: 'Аудитории',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadedContent(ScheduleLoaded state) {
    if (_selectedNavTab == 1) {
      return _buildBookmarksTab(state);
    }
    if (_selectedNavTab == 2) {
      return _buildRoomsTab(state);
    }
    return _buildScheduleTab(state);
  }

  Widget _buildScheduleTab(ScheduleLoaded state) {
    final visibleTalks = state.visibleTalks;

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => context.read<ScheduleCubit>().refresh(),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Hero Time Banner
                  TimeBanner(
                    conference: state.conference,
                    activeTalk: state.currentOrNextTalk,
                    preferredTopicsCount: state.preferredTopics.length,
                    onOpenTopicPreferences: () {
                      TopicPreferenceSheet.show(
                        context,
                        onCompleted: () => context.read<ScheduleCubit>().reloadPreferences(),
                      );
                    },
                    onTalkTap: (talk) => _openTalkDetails(talk),
                  ),

                  // Search input
                  ScheduleSearchBar(
                    onChanged: (val) => context.read<ScheduleCubit>().setSearchQuery(val),
                  ),
                  const SizedBox(height: 14),

                  // Section filter bar
                  SectionFilterBar(
                    sections: state.sections,
                    selectedSectionId: state.selectedSectionId,
                    onSectionSelected: (id) => context.read<ScheduleCubit>().selectSection(id),
                    filterByPreferencesOnly: state.filterByPreferencesOnly,
                    onTogglePreferencesFilter: () => context.read<ScheduleCubit>().togglePreferencesFilter(),
                    timeFilter: state.timeFilter,
                    onTimeFilterChanged: (filter) => context.read<ScheduleCubit>().setTimeFilter(filter),
                  ),
                  const SizedBox(height: 16),

                  // Header with results count
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Доклады конференции',
                        style: AppTypography.titleMedium,
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.muted,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${visibleTalks.length}',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // Talks list
          if (visibleTalks.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: ConfEmptyState(
                icon: Icons.search_off_rounded,
                title: 'Ничего не найдено',
                message: 'По выбранным фильтрам или запросу доклады не найдены. Попробуйте сбросить фильтры.',
                buttonText: 'Показать все доклады',
                onButtonPressed: () {
                  final cubit = context.read<ScheduleCubit>();
                  cubit.selectSection(null);
                  cubit.setSearchQuery('');
                  cubit.setTimeFilter(ScheduleTimeFilter.all);
                },
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final talk = visibleTalks[index];
                    final isBookmarked = state.bookmarkedTalkIds.contains(talk.id);
                    return TalkCard(
                      talk: talk,
                      isBookmarked: isBookmarked,
                      onTap: () => _openTalkDetails(talk),
                      onBookmarkToggle: () => context.read<ScheduleCubit>().toggleBookmark(talk.id),
                    );
                  },
                  childCount: visibleTalks.length,
                ),
              ),
            ),

          const SliverToBoxAdapter(
            child: SizedBox(height: 24),
          ),
        ],
      ),
    );
  }

  Widget _buildBookmarksTab(ScheduleLoaded state) {
    final bookmarkedTalks = state.talks
        .where((t) => state.bookmarkedTalkIds.contains(t.id))
        .toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Моё избранное расписание',
            style: AppTypography.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            'Отмеченные вами доклады, чтобы ничего не пропустить',
            style: AppTypography.bodySmall,
          ),
          const SizedBox(height: 16),
          if (bookmarkedTalks.isEmpty)
            Expanded(
              child: ConfEmptyState(
                icon: Icons.bookmark_add_outlined,
                title: 'Нет сохраненных докладов',
                message: 'Нажмите на закладку в карточке доклада, чтобы составить личное расписание.',
                buttonText: 'Перейти к программе',
                onButtonPressed: () => setState(() => _selectedNavTab = 0),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                itemCount: bookmarkedTalks.length,
                itemBuilder: (context, index) {
                  final talk = bookmarkedTalks[index];
                  return TalkCard(
                    talk: talk,
                    isBookmarked: true,
                    onTap: () => _openTalkDetails(talk),
                    onBookmarkToggle: () => context.read<ScheduleCubit>().toggleBookmark(talk.id),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRoomsTab(ScheduleLoaded state) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Аудитории и локации',
            style: AppTypography.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            'Узнайте, в каких залах сейчас идут выступления',
            style: AppTypography.bodySmall,
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: state.rooms.length,
              itemBuilder: (context, index) {
                final room = state.rooms[index];
                final talksInRoom = state.talks.where((t) => t.room?.id == room.id).toList();

                return Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.secondaryLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.meeting_room_rounded, color: AppColors.primary, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(room.name, style: AppTypography.titleSmall),
                                Text(
                                  'Запланировано докладов: ${talksInRoom.length}',
                                  style: AppTypography.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (talksInRoom.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Divider(height: 1, color: AppColors.divider),
                        const SizedBox(height: 8),
                        ...talksInRoom.take(2).map((t) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: InkWell(
                                onTap: () => _openTalkDetails(t),
                                child: Row(
                                  children: [
                                    const Icon(Icons.schedule, size: 14, color: AppColors.primary),
                                    const SizedBox(width: 6),
                                    Text(
                                      t.startTime != null
                                          ? '${t.startTime!.hour.toString().padLeft(2, "0")}:${t.startTime!.minute.toString().padLeft(2, "0")}'
                                          : '--:--',
                                      style: AppTypography.monoTime.copyWith(fontSize: 12),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        t.title,
                                        style: AppTypography.bodySmall.copyWith(
                                          color: AppColors.textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
