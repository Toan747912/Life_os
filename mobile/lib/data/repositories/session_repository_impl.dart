import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:study_os_app/data/datasources/database_helper.dart';
import 'package:study_os_app/data/models/session_model.dart';
import 'package:study_os_app/domain/entities/focus_session.dart';
import 'package:study_os_app/domain/repositories/session_repository.dart';
import 'package:study_os_app/domain/repositories/auth_repository.dart';

class SessionRepositoryImpl implements SessionRepository {
  final DatabaseHelper databaseHelper;
  final http.Client client;
  final AuthRepository authRepository;
  final String _baseUrl = Platform.isAndroid
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080';

  SessionRepositoryImpl(
    this.databaseHelper,
    this.authRepository, {
    http.Client? client,
  }) : client = client ?? http.Client();

  @override
  Future<void> saveSession(FocusSession session) async {
    final db = await databaseHelper.database;
    final model = SessionModel(
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      durationSeconds: session.durationSeconds,
      status: session.status,
      sessionTag: session.sessionTag,
      notes: session.notes,
      taskId: session.taskId,
      subjectId: session.subjectId,
    );
    await db.insert('focus_sessions', model.toMap());

    // Sync to Backend
    try {
      final token = authRepository.accessToken;
      final headers = {'Content-Type': 'application/json'};
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await client.post(
        Uri.parse('$_baseUrl/focus/sessions'),
        headers: headers,
        // TODO: Add Authorization header
        body: jsonEncode({
          'startTime': session.startTime.toIso8601String(),
          'endTime': (session.endTime ?? DateTime.now())
              .toIso8601String(), // Default to now if null
          'duration': session.durationSeconds,
          'status': session.status.toString().split('.').last, // 'completed'
          'linkedEntityId': session.taskId ?? session.subjectId,
        }),
      );
      if (response.statusCode != 201) {
        debugPrint(
          'Backend sync failed: ${response.statusCode} ${response.body}',
        );
      }
    } catch (e) {
      debugPrint('Backend sync error: $e');
    }
  }

  @override
  Future<List<FocusSession>> getRecentSessions() async {
    final db = await databaseHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'focus_sessions',
      orderBy: 'start_time DESC',
      limit: 10,
    );
    return List.generate(maps.length, (i) {
      return SessionModel.fromMap(maps[i]);
    });
  }
}
