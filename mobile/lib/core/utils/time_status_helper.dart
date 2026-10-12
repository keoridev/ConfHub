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
    if ((now.isAfter(localStart) || now.isAtSameMomentAs(localStart)) && now.isBefore(localEnd)) {
      final elapsed = now.difference(localStart).inMinutes;
      final endsInMinutes = localEnd.difference(now).inMinutes;
      return TalkTimeStatus(
        urgency: TalkUrgency.live,
        label: 'Идёт сейчас',
        detail: endsInMinutes > 0 ? 'Ещё $endsInMinutes мин (идёт $elapsed мин)' : 'Завершается',
        badgeBg: AppColors.statusLiveBg,
        badgeTextColor: AppColors.statusLive,
        icon: Icons.sensors_rounded,
        minutesLeft: 0,
      );
    }

    // 2. Is it in the past?
    if (now.isAfter(localEnd) || now.isAtSameMomentAs(localEnd)) {
      final finishedMinutesAgo = now.difference(localEnd).inMinutes;
      final String finishDetail;
      if (finishedMinutesAgo < 60 && now.day == localEnd.day) {
        finishDetail = '$finishedMinutesAgo мин назад';
      } else {
        finishDetail = 'Закончился в ${DateFormatter.formatTime(localEnd)}';
      }

      return TalkTimeStatus(
        urgency: TalkUrgency.finished,
        label: 'Завершён',
        detail: finishDetail,
        badgeBg: AppColors.statusFinishedBg,
        badgeTextColor: AppColors.statusFinished,
        icon: Icons.check_circle_outline_rounded,
        minutesLeft: -finishedMinutesAgo,
      );
    }

    // 3. In the future:
    final diff = localStart.difference(now);
    final minutes = diff.inMinutes;
    final isSameDay = now.year == localStart.year &&
        now.month == localStart.month &&
        now.day == localStart.day;

    if (isSameDay) {
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
      } else if (minutes <= 45) {
        return TalkTimeStatus(
          urgency: TalkUrgency.canMakeIt,
          label: 'Успеваете! (через $minutes мин)',
          detail: 'Спокойно дойдете за 3-5 мин',
          badgeBg: AppColors.statusCanMakeItBg,
          badgeTextColor: AppColors.statusCanMakeIt,
          icon: Icons.schedule_rounded,
          minutesLeft: minutes,
        );
      } else {
        return TalkTimeStatus(
          urgency: TalkUrgency.upcoming,
          label: 'Сегодня в ${DateFormatter.formatTime(localStart)}',
          detail: diff.inHours > 0
              ? 'Через ${diff.inHours} ч. ${minutes % 60} мин'
              : 'Через $minutes мин',
          badgeBg: AppColors.secondaryLight,
          badgeTextColor: AppColors.secondary,
          icon: Icons.alarm_rounded,
          minutesLeft: minutes,
        );
      }
    } else {
      // Future date
      final daysDiff = diff.inDays;
      final dateLabel = daysDiff == 1
          ? 'Завтра в ${DateFormatter.formatTime(localStart)}'
          : '${DateFormatter.formatDate(localStart)} в ${DateFormatter.formatTime(localStart)}';

      return TalkTimeStatus(
        urgency: TalkUrgency.upcoming,
        label: dateLabel,
        detail: daysDiff > 0 ? 'Через $daysDiff дн.' : 'Запланировано',
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
    DateTime? endTime,
    DateTime? currentTime,
  }) {
    if (startTime == null) {
      return const CommuteEstimate(
        canMakeIt: true,
        marginMinutes: 0,
        walkingMinutes: 0,
        minutesToStart: 0,
        verdict: 'Время доклада пока не зафиксировано организаторами.',
        color: AppColors.statusFinished,
      );
    }

    final now = currentTime ?? DateTime.now();
    final localStart = startTime.toLocal();
    final localEnd = endTime?.toLocal() ?? localStart.add(const Duration(minutes: 45));

    // 1. Talk already finished
    if (now.isAfter(localEnd)) {
      return CommuteEstimate(
        canMakeIt: false,
        marginMinutes: 0,
        walkingMinutes: walkingMinutes,
        minutesToStart: -now.difference(localStart).inMinutes,
        isFinished: true,
        verdict: 'Доклад уже завершился в ${DateFormatter.formatTime(localEnd)}.',
        color: AppColors.statusFinished,
      );
    }

    // 2. Talk in progress right now
    if (now.isAfter(localStart) && now.isBefore(localEnd)) {
      final elapsed = now.difference(localStart).inMinutes;
      final remaining = localEnd.difference(now).inMinutes;
      final canCatchSubstantial = remaining >= walkingMinutes + 3;

      return CommuteEstimate(
        canMakeIt: canCatchSubstantial,
        marginMinutes: remaining - walkingMinutes,
        walkingMinutes: walkingMinutes,
        minutesToStart: -elapsed,
        isLive: true,
        verdict: canCatchSubstantial
            ? 'Доклад идёт уже $elapsed мин. Если выйдете сейчас, дойдёте за $walkingMinutes мин и успеете на вторую часть (осталось $remaining мин)!'
            : 'Доклад уже завершается (осталось $remaining мин). Вы вряд ли застанете выступление.',
        color: canCatchSubstantial ? AppColors.statusHurry : AppColors.statusMissed,
      );
    }

    // 3. Talk is upcoming
    final isSameDay = now.year == localStart.year &&
        now.month == localStart.month &&
        now.day == localStart.day;

    final minutesUntilStart = localStart.difference(now).inMinutes;
    final margin = minutesUntilStart - walkingMinutes;

    if (!isSameDay) {
      // Future calendar day
      final days = localStart.difference(now).inDays;
      final bestLeaveTime = localStart.subtract(Duration(minutes: walkingMinutes + 5));

      return CommuteEstimate(
        canMakeIt: true,
        marginMinutes: margin,
        walkingMinutes: walkingMinutes,
        minutesToStart: minutesUntilStart,
        isFutureDay: true,
        daysToStart: days > 0 ? days : 1,
        verdict: 'Доклад состоится ${DateFormatter.formatDate(localStart)} в ${DateFormatter.formatTime(localStart)} (~$days дн.). Время в пути: $walkingMinutes мин. В день доклада рекомендуем выйти в ${DateFormatter.formatTime(bestLeaveTime)}.',
        color: AppColors.secondary,
      );
    }

    // Same day upcoming talk
    if (margin >= 7) {
      return CommuteEstimate(
        canMakeIt: true,
        marginMinutes: margin,
        walkingMinutes: walkingMinutes,
        minutesToStart: minutesUntilStart,
        verdict: 'Отличный запас! Успеете дойти за $walkingMinutes мин и занять удобные места (+$margin мин в запасе).',
        color: AppColors.statusCanMakeIt,
      );
    } else if (margin >= 0) {
      return CommuteEstimate(
        canMakeIt: true,
        marginMinutes: margin,
        walkingMinutes: walkingMinutes,
        minutesToStart: minutesUntilStart,
        verdict: 'Успеваете впритык! Выходите прямо сейчас (+$margin мин в запасе до начала).',
        color: AppColors.statusHurry,
      );
    } else {
      final lateBy = margin.abs();
      return CommuteEstimate(
        canMakeIt: false,
        marginMinutes: margin,
        walkingMinutes: walkingMinutes,
        minutesToStart: minutesUntilStart,
        verdict: 'Опоздание на ~$lateBy мин при обычном шаге ($walkingMinutes мин пути). Ускорьтесь, чтобы успеть!',
        color: AppColors.statusMissed,
      );
    }
  }
}

class CommuteEstimate {
  final bool canMakeIt;
  final int marginMinutes;
  final int walkingMinutes;
  final int minutesToStart;
  final String verdict;
  final Color color;
  final bool isLive;
  final bool isFinished;
  final bool isFutureDay;
  final int daysToStart;

  const CommuteEstimate({
    required this.canMakeIt,
    required this.marginMinutes,
    required this.walkingMinutes,
    this.minutesToStart = 0,
    required this.verdict,
    required this.color,
    this.isLive = false,
    this.isFinished = false,
    this.isFutureDay = false,
    this.daysToStart = 0,
  });
}
