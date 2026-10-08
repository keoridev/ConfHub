import 'package:get_it/get_it.dart';
import '../network/dio_client.dart';
import '../storage/local_storage_service.dart';
import '../../features/onboarding/data/datasources/onboarding_local_datasource.dart';
import '../../features/onboarding/data/repositories/onboarding_repository_impl.dart';
import '../../features/onboarding/domain/repositories/onboarding_repository.dart';
import '../../features/onboarding/domain/usecases/get_onboarding_status.dart';
import '../../features/onboarding/domain/usecases/save_onboarding_preferences.dart';
import '../../features/onboarding/presentation/cubit/onboarding_cubit.dart';
import '../../features/schedule/data/datasources/schedule_remote_datasource.dart';
import '../../features/schedule/data/repositories/schedule_repository_impl.dart';
import '../../features/schedule/domain/repositories/schedule_repository.dart';
import '../../features/schedule/domain/usecases/get_current_conference.dart';
import '../../features/schedule/domain/usecases/get_rooms.dart';
import '../../features/schedule/domain/usecases/get_sections.dart';
import '../../features/schedule/domain/usecases/get_talk_detail.dart';
import '../../features/schedule/domain/usecases/get_talks.dart';
import '../../features/schedule/presentation/cubit/schedule_cubit.dart';
import '../../features/schedule/presentation/cubit/talk_detail_cubit.dart';

final sl = GetIt.instance;

Future<void> initDependencies() async {
  // 1. Core Services
  final localStorageService = LocalStorageServiceImpl();
  await localStorageService.init();
  sl.registerSingleton<LocalStorageService>(localStorageService);

  sl.registerLazySingleton<DioClient>(() => DioClient());

  // 2. Onboarding Feature
  sl.registerLazySingleton<OnboardingLocalDataSource>(
    () => OnboardingLocalDataSourceImpl(storageService: sl()),
  );
  sl.registerLazySingleton<OnboardingRepository>(
    () => OnboardingRepositoryImpl(localDataSource: sl()),
  );
  sl.registerLazySingleton<GetOnboardingStatus>(
    () => GetOnboardingStatus(sl()),
  );
  sl.registerLazySingleton<SaveOnboardingPreferences>(
    () => SaveOnboardingPreferences(sl()),
  );
  sl.registerFactory<OnboardingCubit>(
    () => OnboardingCubit(
      getOnboardingStatus: sl(),
      saveOnboardingPreferences: sl(),
    ),
  );

  // 3. Schedule Feature
  sl.registerLazySingleton<ScheduleRemoteDataSource>(
    () => ScheduleRemoteDataSourceImpl(dioClient: sl()),
  );
  sl.registerLazySingleton<ScheduleRepository>(
    () => ScheduleRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<GetCurrentConference>(
    () => GetCurrentConference(sl()),
  );
  sl.registerLazySingleton<GetSections>(
    () => GetSections(sl()),
  );
  sl.registerLazySingleton<GetRooms>(
    () => GetRooms(sl()),
  );
  sl.registerLazySingleton<GetTalks>(
    () => GetTalks(sl()),
  );
  sl.registerLazySingleton<GetTalkDetail>(
    () => GetTalkDetail(sl()),
  );
  sl.registerFactory<ScheduleCubit>(
    () => ScheduleCubit(
      getCurrentConference: sl(),
      getSections: sl(),
      getRooms: sl(),
      getTalks: sl(),
      localStorageService: sl(),
    ),
  );
  sl.registerFactory<TalkDetailCubit>(
    () => TalkDetailCubit(
      getTalkDetail: sl(),
      localStorageService: sl(),
    ),
  );
}
