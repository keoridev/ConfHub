import '../repositories/onboarding_repository.dart';

class SaveOnboardingPreferences {
  final OnboardingRepository repository;

  SaveOnboardingPreferences(this.repository);

  Future<void> call({
    required List<String> topics,
    bool markSeen = true,
  }) async {
    await repository.saveSelectedTopics(topics);
    if (markSeen) {
      await repository.setHasSeenOnboarding(true);
    }
  }

  Future<void> dismiss() async {
    await repository.setHasSeenOnboarding(true);
  }
}
