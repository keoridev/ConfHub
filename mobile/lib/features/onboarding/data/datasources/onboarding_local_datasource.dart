import '../../../../core/storage/local_storage_service.dart';

abstract class OnboardingLocalDataSource {
  bool get hasSeenOnboarding;
  Future<void> setHasSeenOnboarding(bool seen);
  List<String> getSelectedTopics();
  Future<void> saveSelectedTopics(List<String> topics);
}

class OnboardingLocalDataSourceImpl implements OnboardingLocalDataSource {
  final LocalStorageService storageService;

  OnboardingLocalDataSourceImpl({required this.storageService});

  @override
  bool get hasSeenOnboarding => storageService.hasSeenOnboarding;

  @override
  Future<void> setHasSeenOnboarding(bool seen) => storageService.setHasSeenOnboarding(seen);

  @override
  List<String> getSelectedTopics() => storageService.selectedTopics;

  @override
  Future<void> saveSelectedTopics(List<String> topics) => storageService.setSelectedTopics(topics);
}
