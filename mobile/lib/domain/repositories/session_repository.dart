import 'package:study_os_app/domain/entities/focus_session.dart';

abstract class SessionRepository {
  Future<void> saveSession(FocusSession session);
  Future<List<FocusSession>> getRecentSessions();
}
