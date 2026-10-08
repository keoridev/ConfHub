import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/utils/time_status_helper.dart';
import '../../../../core/widgets/conf_badge.dart';
import '../../../../core/widgets/conf_button.dart';
import '../../domain/entities/talk.dart';
import '../cubit/schedule_cubit.dart';
import '../cubit/talk_detail_cubit.dart';
import '../cubit/talk_detail_state.dart';

class TalkDetailPage extends StatelessWidget {
  final Talk talk;

  const TalkDetailPage({super.key, required this.talk});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<TalkDetailCubit>()..setInitialTalk(talk),
      child: const _TalkDetailView(),
    );
  }
}

class _TalkDetailView extends StatelessWidget {
  const _TalkDetailView();

  void _shareTalk(Talk talk) {
    final text = 'Доклад на ConfHub: "${talk.title}"\n'
        'Спикер: ${talk.speakerName}\n'
        'Аудитория: ${talk.room?.name ?? "уточняется"}\n'
        'Время: ${DateFormatter.formatTimeRange(talk.startTime, talk.endTime)}';
    SharePlus.instance.share(ShareParams(text: text));
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TalkDetailCubit, TalkDetailState>(
      builder: (context, state) {
        if (state is! TalkDetailLoaded) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final talk = state.talk;
        final timeStatus = TimeStatusHelper.calculateStatus(
          startTime: talk.startTime,
          endTime: talk.endTime,
        );

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Text('Детали доклада', style: AppTypography.titleMedium),
            actions: [
              IconButton(
                tooltip: 'Поделиться',
                icon: const Icon(Icons.share_outlined),
                onPressed: () => _shareTalk(talk),
              ),
              IconButton(
                tooltip: 'В избранное',
                icon: Icon(
                  state.isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
                  color: state.isBookmarked ? AppColors.accent : AppColors.primary,
                ),
                onPressed: () {
                  context.read<TalkDetailCubit>().toggleBookmark();
                  context.read<ScheduleCubit>().toggleBookmark(talk.id);
                },
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Card (Room, Time & Status)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: AppColors.border),
                    boxShadow: const [
                      BoxShadow(
                        color: AppColors.shadow,
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          ConfBadge.room(talk.room?.name ?? 'Ауд. уточняется'),
                          ConfBadge(
                            label: timeStatus.label,
                            icon: timeStatus.icon,
                            backgroundColor: timeStatus.badgeBg,
                            textColor: timeStatus.badgeTextColor,
                            isPulsing: timeStatus.urgency == TalkUrgency.live,
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          const Icon(Icons.access_time_filled_rounded, color: AppColors.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            DateFormatter.formatTimeRange(talk.startTime, talk.endTime),
                            style: AppTypography.titleLarge.copyWith(
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.muted,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${talk.durationInMinutes} мин',
                              style: AppTypography.labelSmall,
                            ),
                          ),
                        ],
                      ),
                      if (talk.section != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          'Секция: ${talk.section!.title}',
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.secondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Interactive Commute Readiness Card ("Успею ли я дойти?")
                _buildCommuteCalculator(context, state),
                const SizedBox(height: 18),

                // Talk Title & Tags
                Text(
                  talk.title,
                  style: AppTypography.displayMedium.copyWith(fontSize: 21),
                ),
                if (talk.tags.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: talk.tags.map((tag) => ConfBadge.tag(tag)).toList(),
                  ),
                ],
                const SizedBox(height: 20),

                // Speaker & Supervisor Section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 46,
                            height: 46,
                            decoration: const BoxDecoration(
                              color: AppColors.secondaryLight,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.person_outline_rounded,
                              size: 26,
                              color: AppColors.secondary,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  talk.speakerName,
                                  style: AppTypography.titleMedium,
                                ),
                                if (talk.gradeOrGroup != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    'Группа / Класс: ${talk.gradeOrGroup}',
                                    style: AppTypography.bodySmall,
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (talk.supervisor != null) ...[
                        const SizedBox(height: 12),
                        const Divider(height: 1, color: AppColors.divider),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(Icons.school_outlined, size: 20, color: AppColors.textMuted),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Научный руководитель: ${talk.supervisor}',
                                style: AppTypography.bodyMedium.copyWith(
                                  fontStyle: FontStyle.italic,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Abstract / Summary
                Text('Аннотация доклада', style: AppTypography.titleMedium),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    talk.abstractText.isNotEmpty
                        ? talk.abstractText
                        : 'Автор еще не предоставил подробную аннотацию для данного доклада.',
                    style: AppTypography.bodyLarge.copyWith(height: 1.6),
                  ),
                ),
                const SizedBox(height: 24),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: ConfButton(
                        text: state.isBookmarked ? 'В избранном' : 'В избранное',
                        icon: state.isBookmarked ? Icons.bookmark_added_rounded : Icons.bookmark_add_outlined,
                        variant: state.isBookmarked ? ConfButtonVariant.secondary : ConfButtonVariant.primary,
                        onPressed: () {
                          context.read<TalkDetailCubit>().toggleBookmark();
                          context.read<ScheduleCubit>().toggleBookmark(talk.id);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ConfButton(
                        text: 'Поделиться',
                        icon: Icons.share_rounded,
                        variant: ConfButtonVariant.outline,
                        onPressed: () => _shareTalk(talk),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCommuteCalculator(BuildContext context, TalkDetailLoaded state) {
    final estimate = state.commuteEstimate;
    final cubit = context.read<TalkDetailCubit>();

    final locationOptions = [
      {'name': '1-й этаж (Главный вход / Гардероб)', 'walk': 4},
      {'name': '1-й этаж (Буфет)', 'walk': 5},
      {'name': '2-й этаж (Фойе)', 'walk': 2},
      {'name': '3-й этаж (Лаборатории)', 'walk': 3},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: estimate.color.withAlpha(20),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: estimate.color.withAlpha(80), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                estimate.canMakeIt ? Icons.directions_walk_rounded : Icons.warning_amber_rounded,
                color: estimate.color,
                size: 24,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Успеете ли вы дойти?',
                  style: AppTypography.titleMedium.copyWith(color: estimate.color),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: estimate.color.withAlpha(40),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${state.walkingMinutes} мин пешком',
                  style: AppTypography.labelSmall.copyWith(color: estimate.color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            estimate.verdict,
            style: AppTypography.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 14),

          // Location options picker
          Text('Где вы сейчас находитесь:', style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: locationOptions.map((opt) {
                final isSelected = state.selectedStartLocation == opt['name'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    selected: isSelected,
                    label: Text('${opt['name']} (~${opt['walk']} мин)'),
                    selectedColor: AppColors.primary,
                    backgroundColor: AppColors.surface,
                    side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
                    labelStyle: AppTypography.labelSmall.copyWith(
                      color: isSelected ? AppColors.primaryForeground : AppColors.textPrimary,
                    ),
                    onSelected: (_) => cubit.updateLocation(
                      opt['name'] as String,
                      opt['walk'] as int,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
