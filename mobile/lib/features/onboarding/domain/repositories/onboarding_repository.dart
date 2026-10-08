abstract class OnboardingRepository {
  bool get hasSeenOnboarding;
  Future<void> setHasSeenOnboarding(bool seen);
  List<String> getSelectedTopics();
  Future<void> saveSelectedTopics(List<String> topics);
}
