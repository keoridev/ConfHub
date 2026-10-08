import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_onboarding_status.dart';
import '../../domain/usecases/save_onboarding_preferences.dart';
import 'onboarding_state.dart';

class OnboardingCubit extends Cubit<OnboardingState> {
  final GetOnboardingStatus getOnboardingStatus;
  final SaveOnboardingPreferences saveOnboardingPreferences;

  OnboardingCubit({
    required this.getOnboardingStatus,
    required this.saveOnboardingPreferences,
  }) : super(const OnboardingState());

  void checkStatus() {
    final hasSeen = getOnboardingStatus();
    final savedTopics = getOnboardingStatus.getSelectedTopics();

    emit(state.copyWith(
      shouldShowPrompt: !hasSeen,
      selectedTopics: savedTopics,
    ));
  }

  void updateAvailableTopics(List<String> topics) {
    if (topics.isNotEmpty) {
      emit(state.copyWith(availableTopics: topics));
    }
  }

  void toggleTopic(String topic) {
    final current = List<String>.from(state.selectedTopics);
    if (current.contains(topic)) {
      current.remove(topic);
    } else {
      current.add(topic);
    }
    emit(state.copyWith(selectedTopics: current));
  }

  void selectAllTopics() {
    emit(state.copyWith(selectedTopics: List<String>.from(state.availableTopics)));
  }

  void clearSelection() {
    emit(state.copyWith(selectedTopics: const []));
  }

  Future<void> savePreferences() async {
    emit(state.copyWith(isSaving: true));
    await saveOnboardingPreferences(
      topics: state.selectedTopics,
      markSeen: true,
    );
    emit(state.copyWith(isSaving: false, shouldShowPrompt: false));
  }

  Future<void> dismissPrompt() async {
    await saveOnboardingPreferences.dismiss();
    emit(state.copyWith(shouldShowPrompt: false));
  }
}
