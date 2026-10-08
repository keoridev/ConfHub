import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static final DateFormat _timeFormat = DateFormat('HH:mm');
  static final DateFormat _dateFormat = DateFormat('d MMMM', 'ru');
  static final DateFormat _dateTimeFormat = DateFormat('d MMMM, HH:mm', 'ru');

  /// Formats [DateTime] or ISO string to "10:30"
  static String formatTime(DateTime? dateTime) {
    if (dateTime == null) return '--:--';
    return _timeFormat.format(dateTime.toLocal());
  }

  /// Formats time range: "10:30 — 11:15"
  static String formatTimeRange(DateTime? start, DateTime? end) {
    if (start == null && end == null) return 'Время уточняется';
    if (start != null && end == null) return 'Начало в ${formatTime(start)}';
    if (start == null) return 'До ${formatTime(end)}';
    return '${formatTime(start)} — ${formatTime(end)}';
  }

  /// Formats date: "20 октября"
  static String formatDate(DateTime? dateTime) {
    if (dateTime == null) return '';
    try {
      return _dateFormat.format(dateTime.toLocal());
    } catch (_) {
      return '${dateTime.day}.${dateTime.month}';
    }
  }

  /// Formats full: "20 октября, 10:30"
  static String formatDateTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    try {
      return _dateTimeFormat.format(dateTime.toLocal());
    } catch (_) {
      return '${dateTime.day}.${dateTime.month} ${formatTime(dateTime)}';
    }
  }

  /// Safely parse ISO 8601 string
  static DateTime? parseIso(String? isoString) {
    if (isoString == null || isoString.trim().isEmpty) return null;
    try {
      return DateTime.parse(isoString);
    } catch (_) {
      return null;
    }
  }
}
