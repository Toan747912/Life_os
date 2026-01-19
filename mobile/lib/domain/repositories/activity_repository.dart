import '../entities/activity.dart';

abstract class ActivityRepository {
  Future<List<Activity>> getActivities();
  Future<Activity?> getActivity(String id);
  Future<void> saveActivity(Activity activity);
  Future<void> deleteActivity(String id);
  Future<List<Activity>> getUnsyncedActivities();
  Future<void> markAsSynced(String id, String serverId);
}
