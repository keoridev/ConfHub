import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  ApiConstants._();

  static const String defaultLocalhostUrl = 'http://127.0.0.1:8080';
  static const String defaultEmulatorUrl = 'http://10.0.2.2:8080';
  static const String defaultLanUrl = 'http://192.168.68.101:8080';

  /// Default backend base url.
  /// When USB debugging with adb reverse tcp:8080 tcp:8080 or running on desktop/web,
  /// http://127.0.0.1:8080 connects directly to host backend.
  static String get defaultBaseUrl {
    const definedUrl = String.fromEnvironment('API_URL');
    if (definedUrl.isNotEmpty) {
      return sanitizeUrl(definedUrl);
    }
    if (!kIsWeb && Platform.isAndroid) {
      // In Android, default to 127.0.0.1 (works with adb reverse) or 10.0.2.2 for emulator
      return defaultLocalhostUrl;
    }
    return defaultLocalhostUrl;
  }

  /// Cleans URL removing trailing slashes or /api suffix if present in base
  static String sanitizeUrl(String raw) {
    var url = raw.trim();
    while (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (url.endsWith('/api')) {
      url = url.substring(0, url.length - 4);
    }
    return url;
  }

  static const Duration connectTimeout = Duration(seconds: 6);
  static const Duration receiveTimeout = Duration(seconds: 6);
  static const Duration sendTimeout = Duration(seconds: 6);

  // Endpoints with explicit /api prefix
  static const String health = '/api/health';
  static const String currentConference = '/api/conferences/current';
  static const String conferences = '/api/conferences';
  static String conferenceTalks(int conferenceId) => '/api/conferences/$conferenceId/talks';
  static String talkDetail(int id) => '/api/talks/$id';
  static const String sections = '/api/sections';
  static const String rooms = '/api/rooms';
}
