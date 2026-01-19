import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:isar/isar.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'config/routes/router.dart';
import 'core/di/isar_module.dart';
import 'core/utils/ticker.dart';
import 'data/datasources/database_helper.dart';
import 'data/repositories/activity_repository_impl.dart';
import 'data/repositories/auth_repository_impl.dart';
import 'data/repositories/flashcard_repository_impl.dart';
import 'data/repositories/session_repository_impl.dart';
import 'data/repositories/subject_repository_impl.dart';
import 'data/repositories/task_repository_impl.dart';
import 'data/services/sync_service.dart';
import 'domain/repositories/activity_repository.dart';
import 'domain/repositories/auth_repository.dart';
import 'domain/repositories/flashcard_repository.dart';
import 'domain/repositories/session_repository.dart';
import 'domain/repositories/subject_repository.dart';
import 'domain/repositories/task_repository.dart';
import 'presentation/bloc/auth/auth_bloc.dart';
import 'presentation/blocs/activity/activity_bloc.dart';
import 'presentation/blocs/activity/activity_event.dart';
import 'presentation/blocs/flashcard_bloc.dart';
import 'presentation/blocs/subject_bloc.dart';
import 'presentation/blocs/task_bloc.dart';
import 'presentation/blocs/timer_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!kIsWeb && (Platform.isWindows || Platform.isLinux || Platform.isMacOS)) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  }

  final isar = await IsarModule.init();

  runApp(MyApp(isar: isar));
}

class MyApp extends StatelessWidget {
  final Isar isar;

  const MyApp({super.key, required this.isar});

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<TaskRepository>(
          create: (context) => TaskRepositoryImpl(DatabaseHelper.instance),
        ),
        RepositoryProvider<AuthRepository>(
          create: (context) => AuthRepositoryImpl(),
        ),
        RepositoryProvider<SessionRepository>(
          create: (context) => SessionRepositoryImpl(
            DatabaseHelper.instance,
            context.read<AuthRepository>(),
          ),
        ),
        RepositoryProvider<SubjectRepository>(
          create: (context) => SubjectRepositoryImpl(DatabaseHelper.instance),
        ),
        RepositoryProvider<FlashcardRepository>(
          create: (context) => FlashcardRepositoryImpl(DatabaseHelper.instance),
        ),
        RepositoryProvider<ActivityRepository>(
          create: (context) => ActivityRepositoryImpl(isar),
        ),
        RepositoryProvider<SyncService>(
          create: (context) => SyncService(
            isar: isar,
            authRepository: context.read<AuthRepository>(),
          ),
        ),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<TaskBloc>(
            create: (context) =>
                TaskBloc(repository: context.read<TaskRepository>())
                  ..add(LoadTasks()),
          ),
          BlocProvider<TimerBloc>(
            create: (context) => TimerBloc(
              ticker: const Ticker(),
              sessionRepo: context.read<SessionRepository>(),
            ),
          ),
          BlocProvider<SubjectBloc>(
            create: (context) =>
                SubjectBloc(repository: context.read<SubjectRepository>())
                  ..add(LoadSubjects()),
          ),
          BlocProvider<FlashcardBloc>(
            create: (context) =>
                FlashcardBloc(repository: context.read<FlashcardRepository>())
                  ..add(LoadFlashcards()),
          ),
          BlocProvider<AuthBloc>(
            create: (context) =>
                AuthBloc(authRepository: context.read<AuthRepository>()),
          ),
          BlocProvider<ActivityBloc>(
            create: (context) => ActivityBloc(
              activityRepository: context.read<ActivityRepository>(),
              syncService: context.read<SyncService>(),
            )..add(LoadActivities()),
          ),
        ],
        child: MaterialApp.router(
          title: 'Study OS',
          theme: ThemeData(
            primarySwatch: Colors.blue,
            brightness: Brightness.dark,
            textTheme: GoogleFonts.outfitTextTheme(
              Theme.of(context).textTheme,
            ).apply(bodyColor: Colors.white, displayColor: Colors.white),
            scaffoldBackgroundColor: const Color(0xFF121212),
            // cardTheme: CardTheme(
            //   color: const Color(0xFF1E1E1E),
            //   shape: RoundedRectangleBorder(
            //     borderRadius: BorderRadius.circular(12),
            //   ),
            //   elevation: 4,
            // ),
            appBarTheme: const AppBarTheme(
              backgroundColor: Color(0xFF121212),
              elevation: 0,
              centerTitle: true,
              titleTextStyle: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            useMaterial3: true,
          ),
          routerConfig: router,
        ),
      ),
    );
  }
}
