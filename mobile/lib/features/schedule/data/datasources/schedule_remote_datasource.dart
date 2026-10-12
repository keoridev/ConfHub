import 'dart:developer' as developer;
import '../../../../core/constants/api_constants.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/network/dio_client.dart';
import '../models/conference_model.dart';
import '../models/section_model.dart';
import '../models/room_model.dart';
import '../models/talk_model.dart';

abstract class ScheduleRemoteDataSource {
  Future<ConferenceModel> getCurrentConference();
  Future<List<SectionModel>> getSections({int? conferenceId});
  Future<List<RoomModel>> getRooms({int? conferenceId});
  Future<List<TalkModel>> getConferenceTalks({
    required int conferenceId,
    int? sectionId,
    String? query,
    String? tag,
  });
  Future<TalkModel> getTalkDetail(int talkId);
  bool get isBackendConnected;
}

class ScheduleRemoteDataSourceImpl implements ScheduleRemoteDataSource {
  final DioClient dioClient;
  bool _isBackendConnected = false;

  ScheduleRemoteDataSourceImpl({required this.dioClient});

  @override
  bool get isBackendConnected => _isBackendConnected;

  @override
  Future<ConferenceModel> getCurrentConference() async {
    try {
      final response = await dioClient.get(ApiConstants.currentConference);
      if (response.data is Map<String, dynamic>) {
        _isBackendConnected = true;
        return ConferenceModel.fromJson(response.data as Map<String, dynamic>);
      }
      throw const ServerException(message: 'Неверный формат ответа конференции');
    } catch (e) {
      _isBackendConnected = false;
      developer.log('[ScheduleDS] Backend offline or error, using demo conference data: $e');
      return _getFallbackConference();
    }
  }

  @override
  Future<List<SectionModel>> getSections({int? conferenceId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (conferenceId != null) {
        queryParams['conferenceId'] = conferenceId;
      }
      final response = await dioClient.get(
        ApiConstants.sections,
        queryParameters: queryParams,
      );

      if (response.data is List) {
        return (response.data as List)
            .map((item) => SectionModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return _getFallbackSections();
    } catch (e) {
      developer.log('[ScheduleDS] Backend offline or error, using fallback sections: $e');
      return _getFallbackSections();
    }
  }

  @override
  Future<List<RoomModel>> getRooms({int? conferenceId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (conferenceId != null) {
        queryParams['conferenceId'] = conferenceId;
      }
      final response = await dioClient.get(
        ApiConstants.rooms,
        queryParameters: queryParams,
      );

      if (response.data is List) {
        return (response.data as List)
            .map((item) => RoomModel.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return _getFallbackRooms();
    } catch (e) {
      developer.log('[ScheduleDS] Backend offline or error, using fallback rooms: $e');
      return _getFallbackRooms();
    }
  }

  @override
  Future<List<TalkModel>> getConferenceTalks({
    required int conferenceId,
    int? sectionId,
    String? query,
    String? tag,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'status': 'approved',
      };
      if (sectionId != null) queryParams['sectionId'] = sectionId;
      if (query != null && query.trim().isNotEmpty) queryParams['q'] = query.trim();
      if (tag != null && tag.trim().isNotEmpty) queryParams['tag'] = tag.trim();

      final response = await dioClient.get(
        ApiConstants.conferenceTalks(conferenceId),
        queryParameters: queryParams,
      );

      if (response.data is List) {
        _isBackendConnected = true;
        final talks = (response.data as List)
            .map((item) => TalkModel.fromJson(item as Map<String, dynamic>))
            .toList();
        return talks;
      }
      return _filterFallbackTalks(sectionId: sectionId, query: query, tag: tag);
    } catch (e) {
      _isBackendConnected = false;
      developer.log('[ScheduleDS] Backend offline or error, using fallback talks: $e');
      return _filterFallbackTalks(sectionId: sectionId, query: query, tag: tag);
    }
  }

  @override
  Future<TalkModel> getTalkDetail(int talkId) async {
    try {
      final response = await dioClient.get(ApiConstants.talkDetail(talkId));
      if (response.data is Map<String, dynamic>) {
        return TalkModel.fromJson(response.data as Map<String, dynamic>);
      }
      throw const ServerException(message: 'Неверный формат доклада');
    } catch (e) {
      final fallbackList = _getFallbackTalks();
      return fallbackList.firstWhere(
        (t) => t.id == talkId,
        orElse: () => fallbackList.first,
      );
    }
  }

  // --- Fallback Realistic Conference Data for offline development & resilience ---

  ConferenceModel _getFallbackConference() {
    final now = DateTime.now();
    return ConferenceModel(
      id: 1,
      title: 'Студенческая научно-практическая конференция COMTEHNO 2026',
      startsAt: DateTime(now.year, now.month, now.day, 9, 0),
      endsAt: DateTime(now.year, now.month, now.day, 18, 0),
      isCurrent: true,
    );
  }

  List<SectionModel> _getFallbackSections() {
    return const [
      SectionModel(id: 1, conferenceId: 1, title: 'Искусственный интеллект и ML', sortOrder: 1),
      SectionModel(id: 2, conferenceId: 1, title: 'Мобильная и веб-разработка', sortOrder: 2),
      SectionModel(id: 3, conferenceId: 1, title: 'Кибербезопасность и сети', sortOrder: 3),
      SectionModel(id: 4, conferenceId: 1, title: 'Робототехника и IoT', sortOrder: 4),
    ];
  }

  List<RoomModel> _getFallbackRooms() {
    return const [
      RoomModel(id: 1, conferenceId: 1, name: 'Ауд. 101 (Главный зал)'),
      RoomModel(id: 2, conferenceId: 1, name: 'Ауд. 204 (Конференц-зал)'),
      RoomModel(id: 3, conferenceId: 1, name: 'Ауд. 312 (Лаборатория ИИ)'),
      RoomModel(id: 4, conferenceId: 1, name: 'Актовый зал (Корпус А)'),
    ];
  }

  List<TalkModel> _filterFallbackTalks({int? sectionId, String? query, String? tag}) {
    var talks = _getFallbackTalks();
    if (sectionId != null) {
      talks = talks.where((t) => t.section?.id == sectionId).toList();
    }
    if (query != null && query.trim().isNotEmpty) {
      final q = query.toLowerCase();
      talks = talks.where((t) =>
          t.title.toLowerCase().contains(q) ||
          t.speakerName.toLowerCase().contains(q) ||
          t.abstractText.toLowerCase().contains(q)).toList();
    }
    if (tag != null && tag.trim().isNotEmpty) {
      talks = talks.where((t) => t.tags.contains(tag)).toList();
    }
    return talks;
  }

  List<TalkModel> _getFallbackTalks() {
    final now = DateTime.now();

    return [
      TalkModel(
        id: 101,
        conferenceId: 1,
        title: 'Применение LLM и RAG-архитектур для студенческих проектов',
        speakerName: 'Алексей Смирнов',
        gradeOrGroup: 'ПИ-21',
        supervisor: 'д.т.н. Исаев Б. Т.',
        section: const SectionModel(id: 1, conferenceId: 1, title: 'Искусственный интеллект и ML', sortOrder: 1),
        room: const RoomModel(id: 2, conferenceId: 1, name: 'Ауд. 204 (Конференц-зал)'),
        abstractText: 'В докладе рассматриваются методы интеграции локальных LLM с векторными базами данных для контекстного поиска в учебных и исследовательских задачах.',
        tags: const ['AI', 'LLM', 'RAG', 'Python'],
        status: 'approved',
        // Starts in 12 minutes (Great time to attend: "Успеваете!")
        startTime: now.add(const Duration(minutes: 12)),
        endTime: now.add(const Duration(minutes: 52)),
        createdAt: now.subtract(const Duration(days: 2)),
      ),
      TalkModel(
        id: 102,
        conferenceId: 1,
        title: 'Архитектура микросервисов и Event-Driven паттерны в Go',
        speakerName: 'Камила Осмонова',
        gradeOrGroup: 'ИСТ-20',
        supervisor: 'к.т.н. Маматов Н. К.',
        section: const SectionModel(id: 2, conferenceId: 1, title: 'Мобильная и веб-разработка', sortOrder: 2),
        room: const RoomModel(id: 1, conferenceId: 1, name: 'Ауд. 101 (Главный зал)'),
        abstractText: 'Практический опыт построения отказоустойчивых сервисов с использованием Kafka, RabbitMQ и протоколов gRPC в распределенной среде.',
        tags: const ['Golang', 'Backend', 'Kafka', 'Architecture'],
        status: 'approved',
        // Starts in 3 minutes (Urgent: "Впритык!")
        startTime: now.add(const Duration(minutes: 3)),
        endTime: now.add(const Duration(minutes: 43)),
        createdAt: now.subtract(const Duration(days: 3)),
      ),
      TalkModel(
        id: 103,
        conferenceId: 1,
        title: 'Автоматизация обнаружения сетевых аномалий с помощью eBPF',
        speakerName: 'Данияр Токтогулов',
        gradeOrGroup: 'КБ-22',
        supervisor: 'доцент Сатыбалдиев Э. Р.',
        section: const SectionModel(id: 3, conferenceId: 1, title: 'Кибербезопасность и сети', sortOrder: 3),
        room: const RoomModel(id: 3, conferenceId: 1, name: 'Ауд. 312 (Лаборатория ИИ)'),
        abstractText: 'Анализ пакетов ядра Linux в реальном времени с минимальным overhead. Применение eBPF программ для предотвращения сетевых атак.',
        tags: const ['Security', 'Linux', 'eBPF', 'Networks'],
        status: 'approved',
        // Currently Live!
        startTime: now.subtract(const Duration(minutes: 15)),
        endTime: now.add(const Duration(minutes: 25)),
        createdAt: now.subtract(const Duration(days: 4)),
      ),
      TalkModel(
        id: 104,
        conferenceId: 1,
        title: 'Управление автономными мобильными роботами на базе ROS 2',
        speakerName: 'Бектур Кадыров',
        gradeOrGroup: 'РТ-19',
        supervisor: 'проф. Асанов У. А.',
        section: const SectionModel(id: 4, conferenceId: 1, title: 'Робототехника и IoT', sortOrder: 4),
        room: const RoomModel(id: 4, conferenceId: 1, name: 'Актовый зал (Корпус А)'),
        abstractText: 'Построение карт и навигация (SLAM) мобильного колесного робота в условиях динамических препятствий с сенсорами LiDAR.',
        tags: const ['Robotics', 'ROS2', 'SLAM', 'Hardware'],
        status: 'approved',
        // Starts in 1 hour 15 min
        startTime: now.add(const Duration(minutes: 75)),
        endTime: now.add(const Duration(minutes: 120)),
        createdAt: now.subtract(const Duration(days: 1)),
      ),
      TalkModel(
        id: 105,
        conferenceId: 1,
        title: 'Кроссплатформенная разработка на Flutter: Best Practices 2026',
        speakerName: 'Айпери Жумабекова',
        gradeOrGroup: 'ПИ-21',
        supervisor: 'ст. преп. Беков Т.',
        section: const SectionModel(id: 2, conferenceId: 1, title: 'Мобильная и веб-разработка', sortOrder: 2),
        room: const RoomModel(id: 1, conferenceId: 1, name: 'Ауд. 101 (Главный зал)'),
        abstractText: 'Чистая архитектура, управление состоянием Bloc/Cubit, оптимизация рендеринга и профилирование памяти в крупных Flutter приложениях.',
        tags: const ['Flutter', 'Mobile', 'CleanArchitecture', 'Dart'],
        status: 'approved',
        // Starts in 2 hours
        startTime: now.add(const Duration(minutes: 130)),
        endTime: now.add(const Duration(minutes: 175)),
        createdAt: now.subtract(const Duration(days: 1)),
      ),
    ];
  }
}
