import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/conf_shimmer.dart';

class ScheduleShimmer extends StatelessWidget {
  const ScheduleShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 4,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  ConfShimmer(width: 80, height: 24, borderRadius: 12),
                  SizedBox(width: 8),
                  ConfShimmer(width: 110, height: 24, borderRadius: 12),
                ],
              ),
              const SizedBox(height: 14),
              const ConfShimmer(width: double.infinity, height: 18),
              const SizedBox(height: 8),
              const ConfShimmer(width: 220, height: 18),
              const SizedBox(height: 12),
              const ConfShimmer(width: 140, height: 14),
            ],
          ),
        );
      },
    );
  }
}
