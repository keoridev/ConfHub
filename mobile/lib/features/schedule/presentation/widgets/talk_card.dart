import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/utils/time_status_helper.dart';
import '../../../../core/widgets/conf_badge.dart';
import '../../domain/entities/talk.dart';
import 'will_i_make_it_dialog.dart';

class TalkCard extends StatelessWidget {
  final Talk talk;
  final bool isBookmarked;
  final VoidCallback? onTap;
  final VoidCallback? onBookmarkToggle;
  final DateTime? currentTime;

  const TalkCard({
    super.key,
    required this.talk,
    this.isBookmarked = false,
    this.onTap,
    this.onBookmarkToggle,
    this.currentTime,
  });

  @override
  Widget build(BuildContext context) {
    final status = TimeStatusHelper.calculateStatus(
      startTime: talk.startTime,
      endTime: talk.endTime,
      currentTime: currentTime,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: status.urgency == TalkUrgency.live
              ? AppColors.statusLive.withAlpha(120)
              : AppColors.border,
          width: status.urgency == TalkUrgency.live ? 1.5 : 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: Room & Time status badge
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Room badge
                    Flexible(
                      flex: 4,
                      child: ConfBadge.room(talk.room?.name ?? 'Ауд. не назначена'),
                    ),
                    const SizedBox(width: 8),

                    // Time awareness badge
                    Flexible(
                      flex: 5,
                      child: ConfBadge(
                        label: status.label,
                        icon: status.icon,
                        backgroundColor: status.badgeBg,
                        textColor: status.badgeTextColor,
                        isPulsing: status.urgency == TalkUrgency.live,
                      ),
                    ),
                    const SizedBox(width: 4),

                    // Bookmark icon
                    IconButton(
                      icon: Icon(
                        isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                        color: isBookmarked ? AppColors.accent : AppColors.textMuted,
                        size: 22,
                      ),
                      onPressed: onBookmarkToggle,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      splashRadius: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Timing row: "10:30 — 11:15 • 45 мин"
                Row(
                  children: [
                    const Icon(
                      Icons.schedule_rounded,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      DateFormatter.formatTimeRange(talk.startTime, talk.endTime),
                      style: AppTypography.monoTime,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '• ${talk.durationInMinutes} мин',
                      style: AppTypography.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Title
                Text(
                  talk.title,
                  style: AppTypography.titleMedium.copyWith(
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 8),

                // Speaker and Group
                Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: const BoxDecoration(
                        color: AppColors.secondaryLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        size: 15,
                        color: AppColors.secondary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${talk.speakerName}${talk.gradeOrGroup != null ? " • ${talk.gradeOrGroup}" : ""}',
                        style: AppTypography.bodyMedium.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Section and Tags
                if (talk.section != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Text(
                      talk.section!.title,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                // Divider and Action footer
                const Divider(height: 1, color: AppColors.divider),
                const SizedBox(height: 10),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Commute prompt button
                    Flexible(
                      child: InkWell(
                        onTap: () => WillIMakeItDialog.show(context, talk),
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.directions_walk_rounded,
                                size: 16,
                                color: AppColors.primary,
                              ),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  'Успею ли я дойти?',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppTypography.labelMedium.copyWith(
                                    color: AppColors.primary,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Details indicator
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Подробнее',
                          style: AppTypography.labelMedium.copyWith(
                            color: AppColors.textMuted,
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right_rounded,
                          size: 18,
                          color: AppColors.textMuted,
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
