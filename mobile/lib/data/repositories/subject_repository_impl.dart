import 'package:study_os_app/data/datasources/database_helper.dart';
import 'package:study_os_app/data/models/subject_model.dart';
import 'package:study_os_app/domain/entities/subject.dart';
import 'package:study_os_app/domain/repositories/subject_repository.dart';

class SubjectRepositoryImpl implements SubjectRepository {
  final DatabaseHelper databaseHelper;

  SubjectRepositoryImpl(this.databaseHelper);

  @override
  Future<List<Subject>> getSubjects() async {
    final db = await databaseHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'subjects',
      orderBy: 'name ASC',
    );
    return List.generate(maps.length, (i) {
      return SubjectModel.fromMap(maps[i]);
    });
  }

  @override
  Future<void> addSubject(Subject subject) async {
    final db = await databaseHelper.database;
    final model = SubjectModel(
      id: subject.id,
      name: subject.name,
      colorHex: subject.colorHex,
      iconKey: subject.iconKey,
      targetHoursPerWeek: subject.targetHoursPerWeek,
      isArchived: subject.isArchived,
      createdAt: subject.createdAt,
    );
    await db.insert('subjects', model.toMap());
  }

  @override
  Future<void> updateSubject(Subject subject) async {
    final db = await databaseHelper.database;
    final model = SubjectModel(
      id: subject.id,
      name: subject.name,
      colorHex: subject.colorHex,
      iconKey: subject.iconKey,
      targetHoursPerWeek: subject.targetHoursPerWeek,
      isArchived: subject.isArchived,
      createdAt: subject.createdAt,
    );
    await db.update(
      'subjects',
      model.toMap(),
      where: 'id = ?',
      whereArgs: [subject.id],
    );
  }

  @override
  Future<void> deleteSubject(String id) async {
    final db = await databaseHelper.database;
    await db.delete('subjects', where: 'id = ?', whereArgs: [id]);
  }
}
