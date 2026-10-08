import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../domain/entities/conference.dart';
import '../../domain/entities/talk.dart';

class TimeBanner extends StatelessWidget {
  final Conference conference;
  final Talk? activeTalk;
  final int preferredTopicsCount;
  final VoidCallback onOpenTopicPreferences;
  final Function(Talk talk)? onTalkTap;

  const TimeBanner({
    super.key,
    required this.conference,
    this.activeTalk,
    required this.preferredTopicsCount,
    required this.onOpenTopicPreferences,
    this.onTalkTap,
  });

  @override
  Widget build(BuildContext context) {
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
          // Top row: Conf status pill & topic preferences button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.accent.withAlpha(220),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.festival_outlined,
                      size: 13,
                      color: AppColors.primaryDark,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'ГОСТЕВОЙ ДОСТУП',
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.primaryDark,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: onOpenTopicPreferences,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(35),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withAlpha(45)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.tune_rounded,
                        size: 13,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        preferredTopicsCount > 0
                            ? 'Темы ($preferredTopicsCount)'
                            : 'Выбрать темы',
                        style: AppTypography.labelSmall.copyWith(
                          color: Colors.white,
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
          Text(
            DateFormatter.formatDate(conference.startsAt ?? DateTime.now()),
            style: AppTypography.bodySmall.copyWith(
              color: Colors.white70,
            ),
          ),

          if (activeTalk != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(20),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withAlpha(30)),
              ),
              child: InkWell(
                onTap: () => onTalkTap?.call(activeTalk!),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.record_voice_over_rounded,
                        size: 20,
                        color: AppColors.primaryDark,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'Ближайший доклад:',
                                style: AppTypography.labelSmall.copyWith(
                                  color: AppColors.accentLight,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                DateFormatter.formatTime(activeTalk!.startTime),
                                style: AppTypography.monoTime.copyWith(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            activeTalk!.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.titleSmall.copyWith(
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            activeTalk!.room?.name ?? 'Аудитория уточняется',
                            style: AppTypography.bodySmall.copyWith(
                              color: Colors.white70,
                            ),
                          ),
                        ],
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
