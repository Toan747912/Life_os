import 'package:isar/isar.dart';

part 'review_session.g.dart';

@collection
class ReviewSession {
  Id id = Isar.autoIncrement;

  @Index()
  String? serverId;

  @Index()
  int? activityId; // Local Activity ID reference

  String? mode; // 'QUIZ', 'FILL_BLANK', 'SCRAMBLE'

  int? score;

  int? durationSeconds;

  DateTime? createdAt;

  // JSON String structure: [{"word": "intelligence", "input": "inteligence", "type": "TYPO"}]
  String? mistakeDetailsJson;

  bool isSynced = false;
}
