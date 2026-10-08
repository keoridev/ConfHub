import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/schedule/domain/entities/talk.dart';
import '../../features/schedule/presentation/pages/schedule_page.dart';
import '../../features/schedule/presentation/pages/talk_detail_page.dart';

class AppRouter {
  AppRouter._();

  static const String schedule = '/';
  static const String talkDetail = '/talk';

  static final GoRouter router = GoRouter(
    initialLocation: schedule,
    routes: [
      GoRoute(
        path: schedule,
        builder: (context, state) => const SchedulePage(),
      ),
      GoRoute(
        path: talkDetail,
        builder: (context, state) {
          final talk = state.extra as Talk;
          return TalkDetailPage(talk: talk);
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Страница не найдена: ${state.uri.path}'),
      ),
    ),
  );
}
