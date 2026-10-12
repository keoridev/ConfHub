import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../../../core/utils/time_status_helper.dart';
import '../../domain/entities/talk.dart';
import '../../domain/usecases/get_talk_detail.dart';
import 'talk_detail_state.dart';

class TalkDetailCubit extends Cubit<TalkDetailState> {
  final GetTalkDetail getTalkDetail;
  final LocalStorageService localStorageService;

  TalkDetailCubit({
    required this.getTalkDetail,
    required this.localStorageService,
  }) : super(TalkDetailInitial());

  void setInitialTalk(Talk talk) {
    final isBookmarked = localStorageService.isBookmarked(talk.id);
    const defaultLocation = '1-й этаж (Главный вход / Гардероб)';
    const defaultWalkTime = 4;
    final estimate = TimeStatusHelper.estimateCommute(
      walkingMinutes: defaultWalkTime,
      startTime: talk.startTime,
      endTime: talk.endTime,
    );

    emit(TalkDetailLoaded(
      talk: talk,
      isBookmarked: isBookmarked,
      selectedStartLocation: defaultLocation,
      walkingMinutes: defaultWalkTime,
      commuteEstimate: estimate,
    ));
  }

  Future<void> fetchTalk(int talkId) async {
    emit(TalkDetailLoading());
    final result = await getTalkDetail(talkId);

    result.fold(
      (failure) => emit(TalkDetailError(message: failure.message)),
      (talk) => setInitialTalk(talk),
    );
  }

  void updateLocation(String location, int walkingMinutes) {
    if (state is! TalkDetailLoaded) return;
    final current = state as TalkDetailLoaded;
    final estimate = TimeStatusHelper.estimateCommute(
      walkingMinutes: walkingMinutes,
      startTime: current.talk.startTime,
      endTime: current.talk.endTime,
    );

    emit(current.copyWith(
      selectedStartLocation: location,
      walkingMinutes: walkingMinutes,
      commuteEstimate: estimate,
    ));
  }

  Future<void> toggleBookmark() async {
    if (state is! TalkDetailLoaded) return;
    final current = state as TalkDetailLoaded;
    await localStorageService.toggleBookmark(current.talk.id);
    final updated = localStorageService.isBookmarked(current.talk.id);
    emit(current.copyWith(isBookmarked: updated));
  }
}
