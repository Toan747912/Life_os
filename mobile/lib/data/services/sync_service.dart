import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:isar/isar.dart';
import '../models/local_activity.dart';
import '../models/review_session.dart';
import '../../domain/repositories/auth_repository.dart';

class SyncService {
  final Isar isar;
  final http.Client client;
  final AuthRepository authRepository;
  final String _baseUrl = Platform.isAndroid
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080';

  // Simple in-memory storage for last sync time. In real app, persist this.
  DateTime _lastSyncTime = DateTime.fromMillisecondsSinceEpoch(0);

  SyncService({
    required this.isar,
    required this.authRepository,
    http.Client? client,
  }) : client = client ?? http.Client();

  Future<void> pushChanges() async {
    // 1. Get unsynced local activities
    final unsyncedActivities = await isar.localActivitys
        .filter()
        .isSyncedEqualTo(false)
        .findAll();

    if (unsyncedActivities.isEmpty) return;

    final changes = unsyncedActivities.map((a) {
      return {
        'id': a.id.toString(),
        'type': 'ACTIVITY',
        'workspace_id': null,
        'created_at': (a.createdAt ?? DateTime.now()).toIso8601String(),
        'updated_at': (a.updatedAt ?? DateTime.now()).toIso8601String(),
        'data': {
          'title': a.title,
          'due_at': a.dueAt?.toIso8601String(),
          'metadata': a.metadataJson != null
              ? jsonDecode(a.metadataJson!)
              : null,
        },
      };
    }).toList();

    // 1.5 Get unsynced review sessions
    final unsyncedReviews = await isar.reviewSessions
        .filter()
        .isSyncedEqualTo(false)
        .findAll();

    final reviewChanges = unsyncedReviews
        .map(
          (r) => {
            'id': r.id.toString(), // Local Int ID
            'type': 'REVIEW_SESSION',
            'workspace_id': null,
            'created_at': (r.createdAt ?? DateTime.now()).toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
            'data': {
              'server_id': r.serverId,
              'activity_id_local': r.activityId, // Server might need mapping
              'mode': r.mode,
              'score': r.score,
              'duration_seconds': r.durationSeconds,
              'mistakes': r.mistakeDetailsJson != null
                  ? jsonDecode(r.mistakeDetailsJson!)
                  : [],
            },
          },
        )
        .toList();

    changes.addAll(reviewChanges);

    try {
      final token = authRepository.accessToken;
      final headers = {'Content-Type': 'application/json'};
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await client.post(
        Uri.parse('$_baseUrl/sync/push'),
        headers: headers,
        body: jsonEncode({
          'changes': changes,
          'last_pulled_at': _lastSyncTime.toIso8601String(),
        }),
      );

      if (response.statusCode == 201) {
        // Mark as synced
        final body = jsonDecode(response.body);
        final syncedIds = List<String>.from(body['synced'] ?? []);

        await isar.writeTxn(() async {
          for (var local in unsyncedActivities) {
            // Logic to verify if server accepted it, for now assume all success
            local.isSynced = true;
            await isar.localActivitys.put(local);
          }

          for (var review in unsyncedReviews) {
            review.isSynced = true;
            await isar.reviewSessions.put(review);
          }
        });
        debugPrint('Synced ${changes.length} entities to backend.');
      } else {
        debugPrint('Sync Push failed: ${response.statusCode} ${response.body}');
      }
    } catch (e) {
      debugPrint('Sync Push error: $e');
    }
  }

  Future<void> pullChanges() async {
    try {
      final token = authRepository.accessToken;
      final headers = {'Content-Type': 'application/json'};
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await client.get(
        Uri.parse(
          '$_baseUrl/sync/pull?since=${_lastSyncTime.toIso8601String()}',
        ),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(response.body);
        final List<dynamic> changes = body['changes'];
        final String timestamp = body['timestamp'];

        if (changes.isEmpty) {
          _lastSyncTime = DateTime.parse(timestamp);
          return;
        }

        await isar.writeTxn(() async {
          for (var change in changes) {
            // Upsert
            final remoteId = change['id'];
            // Try to find by serverId or some criteria
            // For simplicity, we create new or update if we stored serverId
            // This requires querying by serverId
            final existing = await isar.localActivitys
                .filter()
                .serverIdEqualTo(remoteId)
                .findFirst();

            final activity = existing ?? LocalActivity();
            activity.serverId = remoteId;
            activity.title = change['title'];
            // ... map other fields
            activity.isSynced = true; // It came from server

            await isar.localActivitys.put(activity);
          }
        });

        _lastSyncTime = DateTime.parse(timestamp);
        debugPrint('Pulled ${changes.length} entities from backend.');
      } else {
        debugPrint('Sync Pull failed: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Sync Pull error: $e');
    }
  }
}
