import 'package:hive_ce_flutter/hive_ce_flutter.dart';
import '../constants/storage_constants.dart';

abstract class LocalStorageService {
  Future<void> init();
  bool get hasSeenOnboarding;
  Future<void> setHasSeenOnboarding(bool value);
  List<String> get selectedTopics;
  Future<void> setSelectedTopics(List<String> topics);
  List<int> get bookmarkedTalkIds;
  Future<void> toggleBookmark(int talkId);
  bool isBookmarked(int talkId);
}

class LocalStorageServiceImpl implements LocalStorageService {
  late Box _box;

  @override
  Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(StorageConstants.appPreferencesBox);
  }

  @override
  bool get hasSeenOnboarding {
    return _box.get(StorageConstants.hasSeenOnboardingKey, defaultValue: false) as bool;
  }

  @override
  Future<void> setHasSeenOnboarding(bool value) async {
    await _box.put(StorageConstants.hasSeenOnboardingKey, value);
  }

  @override
  List<String> get selectedTopics {
    final raw = _box.get(StorageConstants.selectedTopicsKey, defaultValue: <String>[]);
    if (raw is List) {
      return raw.map((e) => e.toString()).toList();
    }
    return [];
  }

  @override
  Future<void> setSelectedTopics(List<String> topics) async {
    await _box.put(StorageConstants.selectedTopicsKey, topics);
  }

  @override
  List<int> get bookmarkedTalkIds {
    final raw = _box.get(StorageConstants.bookmarkedTalkIdsKey, defaultValue: <int>[]);
    if (raw is List) {
      return raw.map((e) => int.tryParse(e.toString()) ?? 0).where((id) => id > 0).toList();
    }
    return [];
  }

  @override
  Future<void> toggleBookmark(int talkId) async {
    final current = bookmarkedTalkIds.toSet();
    if (current.contains(talkId)) {
      current.remove(talkId);
    } else {
      current.add(talkId);
    }
    await _box.put(StorageConstants.bookmarkedTalkIdsKey, current.toList());
  }

  @override
  bool isBookmarked(int talkId) {
    return bookmarkedTalkIds.contains(talkId);
  }
}
