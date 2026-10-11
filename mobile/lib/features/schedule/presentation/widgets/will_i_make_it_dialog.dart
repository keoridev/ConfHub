import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/utils/time_status_helper.dart';
import '../../../../core/widgets/conf_badge.dart';
import '../../../../core/widgets/conf_button.dart';
import '../../domain/entities/talk.dart';

class WillIMakeItDialog extends StatefulWidget {
  final Talk talk;

  const WillIMakeItDialog({super.key, required this.talk});

  static void show(BuildContext context, Talk talk) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => WillIMakeItDialog(talk: talk),
    );
  }

  @override
  State<WillIMakeItDialog> createState() => _WillIMakeItDialogState();
}

class _WillIMakeItDialogState extends State<WillIMakeItDialog> {
  // Locations with estimated walking minutes to this talk's room
  final List<Map<String, dynamic>> _locations = [
    {
      'name': '1-й этаж (Главный вход / Гардероб)',
      'walkTime': 4,
      'icon': Icons.door_front_door_outlined,
    },
    {
      'name': '1-й этаж (Столовая / Буфет)',
      'walkTime': 5,
      'icon': Icons.restaurant_outlined,
    },
    {
      'name': '2-й этаж (Конференц-холл / Фойе)',
      'walkTime': 2,
      'icon': Icons.stairs_outlined,
    },
    {
      'name': '3-й этаж (Лаборатории)',
      'walkTime': 3,
      'icon': Icons.science_outlined,
    },
    {
      'name': 'Двор / Парковка кампуса',
      'walkTime': 7,
      'icon': Icons.park_outlined,
    },
  ];

  late int _selectedLocationIndex;

  @override
  void initState() {
    super.initState();
    _selectedLocationIndex = 0;
  }

  @override
  Widget build(BuildContext context) {
    final talk = widget.talk;
    final selected = _locations[_selectedLocationIndex];
    final walkMinutes = selected['walkTime'] as int;

    final estimate = TimeStatusHelper.estimateCommute(
      walkingMinutes: walkMinutes,
      startTime: talk.startTime,
    );

    final now = DateTime.now();
    final minutesToStart = talk.startTime != null
        ? talk.startTime!.toLocal().difference(now).inMinutes
        : 0;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.only(top: 14, left: 20, right: 20, bottom: 28),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: AppColors.muted,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.secondaryLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.directions_walk_rounded, color: AppColors.primary, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Успею ли я дойти?',
                          style: AppTypography.titleLarge,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Расчет времени до ${talk.room?.name ?? "аудитории"}',
                          style: AppTypography.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Target Talk Info Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: ConfBadge.room(talk.room?.name ?? 'Аудитория не указана'),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          DateFormatter.formatTimeRange(talk.startTime, talk.endTime),
                          style: AppTypography.monoTime,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      talk.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.titleSmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Location Selector
              Text('Где вы сейчас находитесь?', style: AppTypography.titleSmall),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: List.generate(_locations.length, (index) {
                    final loc = _locations[index];
                    final isSelected = index == _selectedLocationIndex;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        selected: isSelected,
                        avatar: Icon(
                          loc['icon'] as IconData,
                          size: 16,
                          color: isSelected ? AppColors.primaryForeground : AppColors.primary,
                        ),
                        label: Text('${loc['name']} (~${loc['walkTime']} мин)'),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surfaceSubtle,
                        side: BorderSide(
                          color: isSelected ? AppColors.primary : AppColors.border,
                        ),
                        labelStyle: AppTypography.labelMedium.copyWith(
                          color: isSelected ? AppColors.primaryForeground : AppColors.textPrimary,
                        ),
                        onSelected: (_) => setState(() => _selectedLocationIndex = index),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 20),

              // Verdict banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: estimate.color.withAlpha(25),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: estimate.color.withAlpha(80), width: 1.2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          estimate.canMakeIt ? Icons.check_circle_rounded : Icons.warning_rounded,
                          color: estimate.color,
                          size: 24,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            estimate.canMakeIt ? 'ВЫ УСПЕВАЕТЕ!' : 'ВНИМАНИЕ!',
                            style: AppTypography.titleMedium.copyWith(
                              color: estimate.color,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      estimate.verdict,
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _buildCommuteMetric(
                          'В пути',
                          '$walkMinutes мин',
                          Icons.directions_walk_rounded,
                        ),
                        const SizedBox(width: 8),
                        _buildCommuteMetric(
                          'До начала',
                          minutesToStart > 0 ? '$minutesToStart мин' : 'Идёт',
                          Icons.timer_outlined,
                        ),
                        const SizedBox(width: 8),
                        _buildCommuteMetric(
                          'Запас',
                          estimate.marginMinutes >= 0 ? '+${estimate.marginMinutes} мин' : '${estimate.marginMinutes} мин',
                          Icons.hourglass_bottom_rounded,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Done button
              ConfButton(
                text: 'Понятно, спасибо!',
                width: double.infinity,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCommuteMetric(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 12, color: AppColors.textMuted),
                const SizedBox(width: 3),
                Expanded(
                  child: Text(
                    label,
                    style: AppTypography.labelSmall.copyWith(fontSize: 10, color: AppColors.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: AppTypography.titleSmall.copyWith(fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
