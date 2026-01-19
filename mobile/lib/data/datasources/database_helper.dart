import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('study_os.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: _onUpgrade,
    );
  }

  Future _createDB(Database db, int version) async {
    const idType = 'TEXT PRIMARY KEY';
    const textType = 'TEXT NOT NULL';
    const boolType = 'BOOLEAN NOT NULL';
    const intType = 'INTEGER NOT NULL';
    const nullableTextType = 'TEXT';

    // 1. Subjects
    await db.execute('''
CREATE TABLE subjects (
  id $idType,
  name $textType,
  color_hex $textType,
  icon_key $nullableTextType,
  target_hours_per_week $intType,
  is_archived $boolType,
  created_at $textType,
  updated_at $textType
)
''');

    // 2. Tasks
    await db.execute('''
CREATE TABLE tasks (
  id $idType,
  title $textType,
  description $nullableTextType,
  priority $textType,
  status $textType,
  due_date $nullableTextType,
  is_recurring $boolType,
  recurrence_rule $nullableTextType,
  subject_id $nullableTextType,
  parent_id $nullableTextType,
  original_task_id $nullableTextType,
  created_at $textType,
  updated_at $textType
)
''');

    // 3. Focus Sessions
    await db.execute('''
CREATE TABLE focus_sessions (
  id $idType,
  start_time $textType,
  end_time $nullableTextType,
  duration_seconds $intType,
  status $textType,
  session_tag $nullableTextType,
  notes $nullableTextType,
  task_id $nullableTextType,
  subject_id $nullableTextType,
  created_at $textType
)
''');

    // 4. Notes
    await db.execute('''
CREATE TABLE notes (
  id $idType,
  title $textType,
  content $nullableTextType,
  is_archived $boolType,
  subject_id $nullableTextType,
  created_at $textType,
  updated_at $textType
)
''');

    // 5. Flashcards
    await db.execute('''
CREATE TABLE flashcards (
  id $idType,
  front_content $textType,
  back_content $textType,
  card_type $textType,
  "interval" $intType,
  repetition $intType,
  ease_factor REAL NOT NULL,
  next_review_date $textType,
  note_id $nullableTextType,
  created_at $textType,
  updated_at $textType
)
''');

    // 6. Entities (Dynamic Data) - Added in v2
    await _createEntitiesTable(db);
  }

  Future _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await _createEntitiesTable(db);
    }
  }

  Future<void> _createEntitiesTable(Database db) async {
    await db.execute('''
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  workspace_id TEXT,
  parent_id TEXT,
  position TEXT,
  created_at TEXT,
  updated_at TEXT,
  synced_at TEXT,
  deleted_at TEXT
)
''');
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }
}
