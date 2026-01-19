import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import '../../data/models/local_activity.dart';
import '../../data/models/review_session.dart';

class IsarModule {
  static Future<Isar> init() async {
    final dir = await getApplicationDocumentsDirectory();
    final isar = await Isar.open([
      LocalActivitySchema,
      ReviewSessionSchema,
    ], directory: dir.path);
    return isar;
  }
}
