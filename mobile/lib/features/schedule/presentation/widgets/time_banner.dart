import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/utils/time_status_helper.dart';
import '../../domain/entities/conference.dart';
import '../../domain/entities/talk.dart';
import 'server_connection_dialog.dart';
import 'will_i_make_it_dialog.dart';

class TimeBanner extends StatelessWidget {
  final Conference conference;
  final Talk? activeTalk;
  final int preferredTopicsCount;
  final VoidCallback onOpenTopicPreferences;
  final Function(Talk talk)? onTalkTap;
  final bool isBackendOnline;
  final String serverUrl;
  final DateTime? currentTime;

  const TimeBanner({
    super.key,
    required this.conference,
    this.activeTalk,
    required this.preferredTopicsCount,
    required this.onOpenTopicPreferences,
    this.onTalkTap,
    this.isBackendOnline = true,
    this.serverUrl = '',
    this.currentTime,
  });

  @override
  Widget build(BuildContext context) {
    final now = currentTime ?? DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, "0")}:${now.minute.toString().padLeft(2, "0")}:${now.second.toString().padLeft(2, "0")}';

    TalkTimeStatus? activeStatus;
    if (activeTalk != null) {
      activeStatus = TimeStatusHelper.calculateStatus(
        startTime: activeTalk!.startTime,
        endTime: activeTalk!.endTime,
        currentTime: now,
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            AppColors.primary,
            AppColors.primaryDark,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x301A4D3E),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: Real-time clock & backend status indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Real-time clock pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(30),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withAlpha(40)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Сейчас: $timeStr',
                      style: AppTypography.monoTime.copyWith(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),

              // Server status button
              InkWell(
                onTap: () => ServerConnectionDialog.show(context),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isBackendOnline
                        ? AppColors.statusCanMakeIt.withAlpha(45)
                        : AppColors.statusHurry.withAlpha(45),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isBackendOnline
                          ? AppColors.statusCanMakeIt.withAlpha(120)
                          : AppColors.statusHurry.withAlpha(120),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isBackendOnline ? Icons.check_circle_rounded : Icons.cloud_off_rounded,
                        size: 13,
                        color: isBackendOnline ? AppColors.accent : Colors.amberAccent,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        isBackendOnline ? 'Backend Online' : 'Офлайн (Демо)',
                        style: AppTypography.labelSmall.copyWith(
                          color: isBackendOnline ? AppColors.accent : Colors.amberAccent,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Conference title
          Text(
            conference.title,
            style: AppTypography.titleLarge.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.event_rounded, color: Colors.white70, size: 14),
              const SizedBox(width: 5),
              Text(
                DateFormatter.formatDate(conference.startsAt ?? DateTime.now()),
                style: AppTypography.bodySmall.copyWith(
                  color: Colors.white70,
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: onOpenTopicPreferences,
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Row(
                    children: [
                      const Icon(Icons.tune_rounded, size: 13, color: Colors.white70),
                      const SizedBox(width: 4),
                      Text(
                        preferredTopicsCount > 0
                            ? 'Мои темы ($preferredTopicsCount)'
                            : 'Выбрать темы',
                        style: AppTypography.labelSmall.copyWith(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Nearest / Live Talk Card
          if (activeTalk != null && activeStatus != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(22),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: activeStatus.urgency == TalkUrgency.live
                      ? AppColors.accent
                      : Colors.white.withAlpha(35),
                  width: activeStatus.urgency == TalkUrgency.live ? 1.5 : 1,
                ),
              ),
              child: InkWell(
                onTap: () => onTalkTap?.call(activeTalk!),
                borderRadius: BorderRadius.circular(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        // Left Icon / Indicator
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: activeStatus.urgency == TalkUrgency.live
                                ? AppColors.accent
                                : Colors.white.withAlpha(30),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            activeStatus.urgency == TalkUrgency.live
                                ? Icons.sensors_rounded
                                : Icons.alarm_rounded,
                            size: 20,
                            color: activeStatus.urgency == TalkUrgency.live
                                ? AppColors.primaryDark
                                : AppColors.accent,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: activeStatus.urgency == TalkUrgency.live
                                            ? AppColors.statusLive
                                            : AppColors.accent.withAlpha(220),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        activeStatus.urgency == TalkUrgency.live
                                            ? 'В ЭФИРЕ ПРЯМО СЕЙЧАС'
                                            : 'БЛИЖАЙШИЙ ДОКЛАД',
                                        style: AppTypography.labelSmall.copyWith(
                                          color: AppColors.primaryDark,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    DateFormatter.formatTime(activeTalk!.startTime),
                                    style: AppTypography.monoTime.copyWith(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                activeTalk!.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.titleSmall.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${activeTalk!.room?.name ?? "Аудитория уточняется"} • ${activeStatus.detail}',
                                style: AppTypography.bodySmall.copyWith(
                                  color: Colors.white70,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Quick Action: "Успею ли я дойти?"
                    InkWell(
                      onTap: () => WillIMakeItDialog.show(context, activeTalk!),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(25),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.directions_walk_rounded,
                              size: 15,
                              color: AppColors.accent,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Успею ли я дойти к началу?',
                              style: AppTypography.labelSmall.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.arrow_forward_rounded,
                              size: 12,
                              color: Colors.white70,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
