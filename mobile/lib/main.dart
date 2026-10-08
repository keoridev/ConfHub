import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'core/core.dart';
import 'features/onboarding/onboarding.dart';
import 'features/schedule/schedule.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize date formatting for Russian locale
  await initializeDateFormatting('ru', null);

  // Initialize all dependencies (Hive, GetIt, Dio, Repositories)
  await initDependencies();

  // Status bar styling
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const ConfHubApp());
}

class ConfHubApp extends StatelessWidget {
  const ConfHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<OnboardingCubit>(
          create: (_) => sl<OnboardingCubit>(),
        ),
        BlocProvider<ScheduleCubit>(
          create: (_) => sl<ScheduleCubit>(),
        ),
      ],
      child: MaterialApp.router(
        title: 'ConfHub — Конференция',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        routerConfig: AppRouter.router,
      ),
    );
  }
}
