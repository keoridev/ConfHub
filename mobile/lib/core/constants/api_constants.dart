import 'dart:io';

class ApiConstants {
  ApiConstants._();

  /// Default backend base url.
  /// For Android emulator, localhost is 10.0.2.2.
  /// For physical devices or desktop, localhost is 127.0.0.1.
  static String get baseUrl {
    const definedUrl = String.fromEnvironment('API_URL');
    if (definedUrl.isNotEmpty) {
      return definedUrl;
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8080/api';
    }
    return 'http://127.0.0.1:8080/api';
  }

  static const Duration connectTimeout = Duration(seconds: 8);
  static const Duration receiveTimeout = Duration(seconds: 8);
  static const Duration sendTimeout = Duration(seconds: 8);

  // Endpoints
  static const String currentConference = '/conferences/current';
  static const String conferences = '/conferences';
  static String conferenceTalks(int conferenceId) => '/conferences/$conferenceId/talks';
  static String talkDetail(int id) => '/talks/$id';
  static const String sections = '/sections';
  static const String rooms = '/rooms';
}
