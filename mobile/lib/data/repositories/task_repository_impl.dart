import 'package:study_os_app/data/datasources/database_helper.dart';
import 'package:study_os_app/data/models/task_model.dart';
import 'package:study_os_app/domain/entities/task.dart';
import 'package:study_os_app/domain/repositories/task_repository.dart';

class TaskRepositoryImpl implements TaskRepository {
  final DatabaseHelper databaseHelper;

  TaskRepositoryImpl(this.databaseHelper);

  @override
  Future<List<Task>> getTasks() async {
    final db = await databaseHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'tasks',
      orderBy: 'created_at DESC',
    );
    return List.generate(maps.length, (i) {
      return TaskModel.fromMap(maps[i]);
    });
  }

  @override
  Future<void> addTask(Task task) async {
    final db = await databaseHelper.database;
    final taskModel = TaskModel(
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      isRecurring: task.isRecurring,
      recurrenceRule: task.recurrenceRule,
      subjectId: task.subjectId,
      parentId: task.parentId,
      createdAt: task.createdAt,
    );
    await db.insert('tasks', taskModel.toMap());
  }

  @override
  Future<void> updateTask(Task task) async {
    final db = await databaseHelper.database;
    final taskModel = TaskModel(
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      isRecurring: task.isRecurring,
      recurrenceRule: task.recurrenceRule,
      subjectId: task.subjectId,
      parentId: task.parentId,
      createdAt: task.createdAt,
    );
    await db.update(
      'tasks',
      taskModel.toMap(),
      where: 'id = ?',
      whereArgs: [task.id],
    );
  }

  @override
  Future<void> deleteTask(String id) async {
    final db = await databaseHelper.database;
    await db.delete('tasks', where: 'id = ?', whereArgs: [id]);
  }
}
