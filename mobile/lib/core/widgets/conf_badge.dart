import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class ConfBadge extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color backgroundColor;
  final Color textColor;
  final Border? border;
  final EdgeInsetsGeometry padding;
  final double fontSize;
  final bool isPulsing;

  const ConfBadge({
    super.key,
    required this.label,
    this.icon,
    this.backgroundColor = AppColors.muted,
    this.textColor = AppColors.textPrimary,
    this.border,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    this.fontSize = 11.5,
    this.isPulsing = false,
  });

  factory ConfBadge.room(String roomName) {
    return ConfBadge(
      label: roomName,
      icon: Icons.meeting_room_outlined,
      backgroundColor: AppColors.secondaryLight,
      textColor: AppColors.secondary,
    );
  }

  factory ConfBadge.live() {
    return const ConfBadge(
      label: 'ИДЁТ СЕЙЧАС',
      icon: Icons.sensors_rounded,
      backgroundColor: AppColors.statusLiveBg,
      textColor: AppColors.statusLive,
      isPulsing: true,
    );
  }

  factory ConfBadge.canMakeIt(String text) {
    return ConfBadge(
      label: text,
      icon: Icons.check_circle_outline_rounded,
      backgroundColor: AppColors.statusCanMakeItBg,
      textColor: AppColors.statusCanMakeIt,
    );
  }

  factory ConfBadge.hurry(String text) {
    return ConfBadge(
      label: text,
      icon: Icons.timer_outlined,
      backgroundColor: AppColors.statusHurryBg,
      textColor: AppColors.statusHurry,
    );
  }

  factory ConfBadge.tag(String tag) {
    return ConfBadge(
      label: '#$tag',
      backgroundColor: AppColors.surfaceSubtle,
      textColor: AppColors.textSecondary,
      border: Border.all(color: AppColors.border, width: 0.8),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: border,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (isPulsing) ...[
            Container(
              width: 7,
              height: 7,
              margin: const EdgeInsets.only(right: 6),
              decoration: BoxDecoration(
                color: textColor,
                shape: BoxShape.circle,
              ),
            ),
          ] else if (icon != null) ...[
            Icon(icon, size: fontSize + 2, color: textColor),
            const SizedBox(width: 5),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.labelSmall.copyWith(
                color: textColor,
                fontSize: fontSize,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
