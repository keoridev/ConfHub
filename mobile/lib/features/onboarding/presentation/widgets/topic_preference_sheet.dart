import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/conf_button.dart';
import '../cubit/onboarding_cubit.dart';
import '../cubit/onboarding_state.dart';

class TopicPreferenceSheet extends StatelessWidget {
  final VoidCallback? onCompleted;

  const TopicPreferenceSheet({super.key, this.onCompleted});

  static Future<void> show(BuildContext context, {VoidCallback? onCompleted}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: context.read<OnboardingCubit>(),
        child: TopicPreferenceSheet(onCompleted: onCompleted),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        top: 12,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: BlocBuilder<OnboardingCubit, OnboardingState>(
        builder: (context, state) {
          final cubit = context.read<OnboardingCubit>();

          return SafeArea(
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
                const SizedBox(height: 18),

                // Header
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.accentLight.withAlpha(160),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.auto_awesome_rounded,
                        color: AppColors.accentDark,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Что вам интересно?',
                            style: AppTypography.titleLarge,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Настроим программу под ваши интересы',
                            style: AppTypography.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                      tooltip: 'Пропустить',
                      onPressed: () {
                        cubit.dismissPrompt();
                        Navigator.of(context).pop();
                        onCompleted?.call();
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Helper text
                Text(
                  'Выберите секции, чтобы подсветить доклады в расписании:',
                  style: AppTypography.bodyMedium,
                ),
                const SizedBox(height: 14),

                // Topics chips
                Wrap(
                  spacing: 8,
                  runSpacing: 10,
                  children: state.availableTopics.map((topic) {
                    final isSelected = state.selectedTopics.contains(topic);
                    return FilterChip(
                      selected: isSelected,
                      label: Text(topic),
                      selectedColor: AppColors.primary,
                      backgroundColor: AppColors.surfaceSubtle,
                      checkmarkColor: AppColors.primaryForeground,
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : AppColors.border,
                        width: 1,
                      ),
                      labelStyle: AppTypography.labelMedium.copyWith(
                        color: isSelected ? AppColors.primaryForeground : AppColors.textPrimary,
                      ),
                      onSelected: (_) => cubit.toggleTopic(topic),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // Action buttons
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: ConfButton(
                        text: 'Все темы',
                        variant: ConfButtonVariant.outline,
                        onPressed: () {
                          cubit.selectAllTopics();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ConfButton(
                        text: state.selectedTopics.isEmpty
                            ? 'Смотреть всё'
                            : 'Применить (${state.selectedTopics.length})',
                        isLoading: state.isSaving,
                        onPressed: () async {
                          await cubit.savePreferences();
                          if (context.mounted) {
                            Navigator.of(context).pop();
                            onCompleted?.call();
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
        },
      ),
    );
  }
}
