import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary palette (Deep Emerald / Forest Pine)
  static const Color primary = Color(0xFF1A4D3E);
  static const Color primaryLight = Color(0xFF2B6B57);
  static const Color primaryDark = Color(0xFF103329);
  static const Color primaryForeground = Color(0xFFF5F3ED);

  // Accent palette (Warm Academic Gold / Honey Amber)
  static const Color accent = Color(0xFFD4A84B);
  static const Color accentLight = Color(0xFFF6E7C4);
  static const Color accentDark = Color(0xFFA57D2C);
  static const Color accentForeground = Color(0xFF1A4D3E);

  // Backgrounds & Surfaces (Warm Ivory / Paper Linen)
  static const Color background = Color(0xFFF5F3ED);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSubtle = Color(0xFFFAF8F3);
  static const Color card = Color(0xFFFFFFFF);

  // Secondary & Muted (Sage Green & Warm Stone)
  static const Color secondary = Color(0xFF3D6B5A);
  static const Color secondaryLight = Color(0xFFE2ECE7);
  static const Color muted = Color(0xFFE8E4DA);
  static const Color mutedForeground = Color(0xFF6B7F76);

  // Text colors
  static const Color textPrimary = Color(0xFF1A4D3E);
  static const Color textSecondary = Color(0xFF4D6359);
  static const Color textMuted = Color(0xFF86978F);
  static const Color textOnPrimary = Color(0xFFF5F3ED);

  // Borders & Dividers
  static const Color border = Color(0x2E1A4D3E);
  static const Color borderSubtle = Color(0x181A4D3E);
  static const Color divider = Color(0x141A4D3E);

  // Semantic Status Colors
  static const Color statusLive = Color(0xFF2563EB); // Blue pulsing
  static const Color statusLiveBg = Color(0xFFEFF6FF);
  
  static const Color statusCanMakeIt = Color(0xFF16A34A); // Green: Plenty of time
  static const Color statusCanMakeItBg = Color(0xFFDCFCE7);

  static const Color statusHurry = Color(0xFFD97706); // Amber/Orange: Running out of time
  static const Color statusHurryBg = Color(0xFFFEF3C7);

  static const Color statusMissed = Color(0xFFDC2626); // Red: Ended or too late
  static const Color statusMissedBg = Color(0xFFFEE2E2);

  static const Color statusFinished = Color(0xFF6B7280); // Gray
  static const Color statusFinishedBg = Color(0xFFF3F4F6);

  // Shadows
  static const Color shadow = Color(0x121A4D3E);
}
