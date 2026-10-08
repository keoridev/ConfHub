import 'package:equatable/equatable.dart';

class OnboardingState extends Equatable {
  final bool shouldShowPrompt;
  final List<String> availableTopics;
  final List<String> selectedTopics;
  final bool isSaving;

  const OnboardingState({
    this.shouldShowPrompt = false,
    this.availableTopics = const [
      'Искусственный интеллект и ML',
      'Мобильная и веб-разработка',
      'Кибербезопасность и сети',
      'Робототехника и IoT',
      'Data Science & Big Data',
      'UI/UX и дизайн продуктов',
    ],
    this.selectedTopics = const [],
    this.isSaving = false,
  });

  OnboardingState copyWith({
    bool? shouldShowPrompt,
    List<String>? availableTopics,
    List<String>? selectedTopics,
    bool? isSaving,
  }) {
    return OnboardingState(
      shouldShowPrompt: shouldShowPrompt ?? this.shouldShowPrompt,
      availableTopics: availableTopics ?? this.availableTopics,
      selectedTopics: selectedTopics ?? this.selectedTopics,
      isSaving: isSaving ?? this.isSaving,
    );
  }

  @override
  List<Object?> get props => [
        shouldShowPrompt,
        availableTopics,
        selectedTopics,
        isSaving,
      ];
}
