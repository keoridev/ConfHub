import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

enum ConfButtonVariant { primary, secondary, outline, text }

class ConfButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final IconData? icon;
  final ConfButtonVariant variant;
  final bool isLoading;
  final double? width;
  final EdgeInsetsGeometry padding;

  const ConfButton({
    super.key,
    required this.text,
    this.onPressed,
    this.icon,
    this.variant = ConfButtonVariant.primary,
    this.isLoading = false,
    this.width,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Border? border;

    switch (variant) {
      case ConfButtonVariant.primary:
        bg = AppColors.primary;
        fg = AppColors.primaryForeground;
        break;
      case ConfButtonVariant.secondary:
        bg = AppColors.accent;
        fg = AppColors.accentForeground;
        break;
      case ConfButtonVariant.outline:
        bg = Colors.transparent;
        fg = AppColors.primary;
        border = Border.all(color: AppColors.primary, width: 1.2);
        break;
      case ConfButtonVariant.text:
        bg = Colors.transparent;
        fg = AppColors.primary;
        break;
    }

    return SizedBox(
      width: width,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: border,
            ),
            alignment: Alignment.center,
            child: isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(fg),
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, size: 18, color: fg),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Text(
                          text,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.labelLarge.copyWith(color: fg),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
