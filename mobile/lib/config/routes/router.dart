import 'package:go_router/go_router.dart';
import '../../presentation/pages/activity_list_screen.dart';
import '../../presentation/pages/login_screen.dart';
import '../../presentation/pages/memorizer_screen.dart';
// import '../../presentation/pages/calendar_screen.dart';
import '../../presentation/pages/learning/game_screen.dart';
import '../../presentation/pages/learning/result_screen.dart';

import '../../presentation/pages/main_screen.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const MainScreen()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/memorizer',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        return MemorizerScreen(extra: extra);
      },
    ),
    GoRoute(
      path: '/learning/game',
      builder: (context, state) {
        final extras = state.extra as Map<String, dynamic>;
        return GameScreen(content: extras['content'], mode: extras['mode']);
      },
    ),
    GoRoute(
      path: '/learning/result',
      builder: (context, state) {
        final extras = state.extra as Map<String, dynamic>;
        return ResultScreen(score: extras['score'], total: extras['total']);
      },
    ),
  ],
);
