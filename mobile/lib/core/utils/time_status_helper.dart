import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'date_formatter.dart';

enum TalkUrgency {
  live,
  canMakeIt,
  hurry,
  upcoming,
  finished,
  unknown,
}

class TalkTimeStatus {
  final TalkUrgency urgency;
  final String label;
  final String detail;
  final Color badgeBg;
  final Color badgeTextColor;
  final IconData icon;
  final int? minutesLeft;

  const TalkTimeStatus({
    required this.urgency,
    required this.label,
    required this.detail,
    required this.badgeBg,
    required this.badgeTextColor,
    required this.icon,
    this.minutesLeft,
  });
}

class TimeStatusHelper {
  TimeStatusHelper._();

  /// Calculates status of talk relative to [currentTime].
  /// If [currentTime] is omitted, uses [DateTime.now()].
  static TalkTimeStatus calculateStatus({
    required DateTime? startTime,
    required DateTime? endTime,
    DateTime? currentTime,
  }) {
    if (startTime == null) {
      return const TalkTimeStatus(
        urgency: TalkUrgency.unknown,
        label: 'Время не назначено',
        detail: 'Ожидается расписание',
        badgeBg: AppColors.statusFinishedBg,
        badgeTextColor: AppColors.statusFinished,
        icon: Icons.access_time,
      );
    }

    final now = currentTime ?? DateTime.now();
    final localStart = startTime.toLocal();
    final localEnd = endTime?.toLocal() ?? localStart.add(const Duration(minutes: 45));

    // 1. Is it currently happening?
    if (now.isAfter(localStart) && now.isBefore(localEnd)) {
      final endsInMinutes = localEnd.difference(now).inMinutes;
      return TalkTimeStatus(
        urgency: TalkUrgency.live,
        label: 'Идёт сейчас',
        detail: endsInMinutes > 0 ? 'Ещё $endsInMinutes мин' : 'Завершается',
        badgeBg: AppColors.statusLiveBg,
        badgeTextColor: AppColors.statusLive,
        icon: Icons.sensors_rounded,
        minutesLeft: 0,
      );
    }

    // 2. Is it in the past?
    if (now.isAfter(localEnd)) {
      return TalkTimeStatus(
        urgency: TalkUrgency.finished,
        label: 'Завершён',
        detail: 'Закончился в ${DateFormatter.formatTime(localEnd)}',
        badgeBg: AppColors.statusFinishedBg,
        badgeTextColor: AppColors.statusFinished,
        icon: Icons.check_circle_outline_rounded,
      );
    }

    // 3. In the future:
    final diff = localStart.difference(now);
    final minutes = diff.inMinutes;

    if (minutes <= 10) {
      return TalkTimeStatus(
        urgency: TalkUrgency.hurry,
        label: minutes <= 1 ? 'Начало с минуты на минуту' : 'Впритык! Через $minutes мин',
        detail: 'Поторопитесь к аудитории',
        badgeBg: AppColors.statusHurryBg,
        badgeTextColor: AppColors.statusHurry,
        icon: Icons.directions_run_rounded,
        minutesLeft: minutes,
      );
    } else if (minutes <= 60) {
      return TalkTimeStatus(
        urgency: TalkUrgency.canMakeIt,
        label: 'Успеваете! (через $minutes мин)',
        detail: 'Спокойно дойдете за 3-5 мин',
        badgeBg: AppColors.statusCanMakeItBg,
        badgeTextColor: AppColors.statusCanMakeIt,
        icon: Icons.schedule_rounded,
        minutesLeft: minutes,
      );
    } else if (diff.inHours < 24 && now.day == localStart.day) {
      return TalkTimeStatus(
        urgency: TalkUrgency.upcoming,
        label: 'Сегодня в ${DateFormatter.formatTime(localStart)}',
        detail: 'Через ${diff.inHours} ч. ${minutes % 60} мин',
        badgeBg: AppColors.secondaryLight,
        badgeTextColor: AppColors.secondary,
        icon: Icons.alarm_rounded,
        minutesLeft: minutes,
      );
    } else {
      return TalkTimeStatus(
        urgency: TalkUrgency.upcoming,
        label: DateFormatter.formatDateTime(localStart),
        detail: 'Запланировано',
        badgeBg: AppColors.muted,
        badgeTextColor: AppColors.textPrimary,
        icon: Icons.calendar_today_rounded,
        minutesLeft: minutes,
      );
    }
  }

  /// Estimates if guest will make it from a starting point
  static CommuteEstimate estimateCommute({
    required int walkingMinutes,
    required DateTime? startTime,
    DateTime? currentTime,
  }) {
    if (startTime == null) {
      return const CommuteEstimate(
        canMakeIt: true,
        marginMinutes: 0,
        walkingMinutes: 0,
        verdict: 'Время доклада пока не зафиксировано',
        color: AppColors.statusFinished,
      );
    }

    final now = currentTime ?? DateTime.now();
    final localStart = startTime.toLocal();
    final minutesUntilStart = localStart.difference(now).inMinutes;

    if (now.isAfter(localStart)) {
      return const CommuteEstimate(
        canMakeIt: false,
        marginMinutes: 0,
        walkingMinutes: 0,
        verdict: 'Доклад уже начался. Заходите тихо через заднюю дверь!',
        color: AppColors.statusHurry,
      );
    }

    final margin = minutesUntilStart - walkingMinutes;

    if (margin >= 7) {
      return CommuteEstimate(
        canMakeIt: true,
        marginMinutes: margin,
        walkingMinutes: walkingMinutes,
        verdict: 'Отличный запас! Успеете занять удобные места (+$margin мин в запасе).',
        color: AppColors.statusCanMakeIt,
      );
    } else if (margin >= 0) {
      return CommuteEstimate(
        canMakeIt: true,
        marginMinutes: margin,
        walkingMinutes: walkingMinutes,
        verdict: 'Успеваете впритык! Выходите прямо сейчас (+$margin мин в запасе).',
        color: AppColors.statusHurry,
      );
    } else {
      final lateBy = margin.abs();
      return CommuteEstimate(
        canMakeIt: false,
        marginMinutes: margin,
        walkingMinutes: walkingMinutes,
        verdict: 'Опоздание на ~$lateBy мин при обычном шаге. Ускорьтесь!',
        color: AppColors.statusMissed,
      );
    }
  }
}

class CommuteEstimate {
  final bool canMakeIt;
  final int marginMinutes;
  final int walkingMinutes;
  final String verdict;
  final Color color;

  const CommuteEstimate({
    required this.canMakeIt,
    required this.marginMinutes,
    required this.walkingMinutes,
    required this.verdict,
    required this.color,
  });
}
