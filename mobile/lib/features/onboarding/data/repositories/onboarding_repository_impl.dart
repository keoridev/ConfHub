import '../../domain/repositories/onboarding_repository.dart';
import '../datasources/onboarding_local_datasource.dart';

class OnboardingRepositoryImpl implements OnboardingRepository {
  final OnboardingLocalDataSource localDataSource;

  OnboardingRepositoryImpl({required this.localDataSource});

  @override
  bool get hasSeenOnboarding => localDataSource.hasSeenOnboarding;

  @override
  Future<void> setHasSeenOnboarding(bool seen) => localDataSource.setHasSeenOnboarding(seen);

  @override
  List<String> getSelectedTopics() => localDataSource.getSelectedTopics();

  @override
  Future<void> saveSelectedTopics(List<String> topics) => localDataSource.saveSelectedTopics(topics);
}
