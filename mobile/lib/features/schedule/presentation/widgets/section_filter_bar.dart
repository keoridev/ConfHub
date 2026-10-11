import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../domain/entities/section.dart';
import '../cubit/schedule_state.dart';

class SectionFilterBar extends StatelessWidget {
  final List<Section> sections;
  final int? selectedSectionId;
  final Function(int? sectionId) onSectionSelected;
  final bool filterByPreferencesOnly;
  final VoidCallback onTogglePreferencesFilter;
  final ScheduleTimeFilter timeFilter;
  final Function(ScheduleTimeFilter filter) onTimeFilterChanged;

  const SectionFilterBar({
    super.key,
    required this.sections,
    required this.selectedSectionId,
    required this.onSectionSelected,
    required this.filterByPreferencesOnly,
    required this.onTogglePreferencesFilter,
    required this.timeFilter,
    required this.onTimeFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section chips scroll
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              // "My topics" star toggle
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  selected: filterByPreferencesOnly,
                  avatar: Icon(
                    Icons.star_rounded,
                    size: 16,
                    color: filterByPreferencesOnly
                        ? AppColors.accentLight
                        : AppColors.accentDark,
                  ),
                  label: const Text('Мои интересы'),
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  side: BorderSide(
                    color: filterByPreferencesOnly
                        ? AppColors.primary
                        : AppColors.accent.withAlpha(140),
                  ),
                  labelStyle: AppTypography.labelMedium.copyWith(
                    color: filterByPreferencesOnly
                        ? AppColors.primaryForeground
                        : AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                  onSelected: (_) => onTogglePreferencesFilter(),
                ),
              ),

              // "All" chip
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  selected: selectedSectionId == null && !filterByPreferencesOnly,
                  label: const Text('Все секции'),
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  side: BorderSide(
                    color: (selectedSectionId == null && !filterByPreferencesOnly)
                        ? AppColors.primary
                        : AppColors.border,
                  ),
                  labelStyle: AppTypography.labelMedium.copyWith(
                    color: (selectedSectionId == null && !filterByPreferencesOnly)
                        ? AppColors.primaryForeground
                        : AppColors.textPrimary,
                  ),
                  onSelected: (_) => onSectionSelected(null),
                ),
              ),

              // Individual section chips
              ...sections.map((section) {
                final isSelected = selectedSectionId == section.id;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    selected: isSelected,
                    label: Text(section.title),
                    selectedColor: AppColors.primary,
                    backgroundColor: AppColors.surface,
                    side: BorderSide(
                      color: isSelected ? AppColors.primary : AppColors.border,
                    ),
                    labelStyle: AppTypography.labelMedium.copyWith(
                      color: isSelected ? AppColors.primaryForeground : AppColors.textPrimary,
                    ),
                    onSelected: (_) => onSectionSelected(section.id),
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // Quick time filter row
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildTimeFilterPill(
                title: 'Все доклады',
                filter: ScheduleTimeFilter.all,
                icon: Icons.apps_rounded,
              ),
              _buildTimeFilterPill(
                title: 'Сейчас и скоро',
                filter: ScheduleTimeFilter.liveAndSoon,
                icon: Icons.bolt_rounded,
              ),
              _buildTimeFilterPill(
                title: 'Утро (до 13:00)',
                filter: ScheduleTimeFilter.morning,
                icon: Icons.wb_twilight_rounded,
              ),
              _buildTimeFilterPill(
                title: 'День (после 13:00)',
                filter: ScheduleTimeFilter.afternoon,
                icon: Icons.wb_sunny_outlined,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTimeFilterPill({
    required String title,
    required ScheduleTimeFilter filter,
    IconData? icon,
  }) {
    final isSelected = timeFilter == filter;
    final color = isSelected ? AppColors.secondary : AppColors.textSecondary;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: InkWell(
        onTap: () => onTimeFilterChanged(filter),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.secondaryLight : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.secondary : AppColors.borderSubtle,
              width: 0.9,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 13,
                  color: color,
                ),
                const SizedBox(width: 4),
              ],
              Text(
                title,
                style: AppTypography.labelSmall.copyWith(
                  color: color,
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
