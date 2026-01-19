import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:study_os_app/domain/entities/subject.dart';
import 'package:study_os_app/presentation/blocs/subject_bloc.dart';
import 'package:uuid/uuid.dart';

class SubjectScreen extends StatelessWidget {
  const SubjectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Subjects')),
      body: BlocBuilder<SubjectBloc, SubjectState>(
        builder: (context, state) {
          if (state is SubjectLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is SubjectLoaded) {
            if (state.subjects.isEmpty) {
              return const Center(child: Text("No subjects. Add one!"));
            }
            return GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.5,
              ),
              itemCount: state.subjects.length,
              itemBuilder: (context, index) {
                return SubjectCard(subject: state.subjects[index]);
              },
            );
          } else if (state is SubjectError) {
            return Center(child: Text('Error: ${state.message}'));
          }
          return Container();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddSubjectDialog(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddSubjectDialog(BuildContext context) {
    final nameController = TextEditingController();
    Color selectedColor = Colors.blue;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("New Subject"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: "Subject Name"),
              autofocus: true,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              children:
                  [
                    Colors.red,
                    Colors.green,
                    Colors.blue,
                    Colors.orange,
                    Colors.purple,
                  ].map((color) {
                    return GestureDetector(
                      onTap: () {
                        selectedColor = color;
                      },
                      child: CircleAvatar(backgroundColor: color, radius: 12),
                    );
                  }).toList(),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              if (nameController.text.isNotEmpty) {
                final newSubject = Subject(
                  id: const Uuid().v4(),
                  name: nameController.text,
                  colorHex:
                      '#${selectedColor.toARGB32().toRadixString(16).substring(2)}',
                  createdAt: DateTime.now(),
                );
                context.read<SubjectBloc>().add(AddSubject(newSubject));
                Navigator.pop(ctx);
              }
            },
            child: const Text("Add"),
          ),
        ],
      ),
    );
  }
}

class SubjectCard extends StatelessWidget {
  final Subject subject;
  const SubjectCard({super.key, required this.subject});

  @override
  Widget build(BuildContext context) {
    // Parse hex color
    Color color;
    try {
      color = Color(int.parse('0xFF${subject.colorHex.replaceAll('#', '')}'));
    } catch (e) {
      color = Colors.grey;
    }

    return Card(
      color: color.withValues(alpha: 0.2),
      shape: RoundedRectangleBorder(
        side: BorderSide(color: color, width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          // Navigate to details or filter tasks (Logic later)
        },
        onLongPress: () {
          // Delete confirmation
          context.read<SubjectBloc>().add(DeleteSubject(subject.id));
        },
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.book, color: color, size: 32),
              const SizedBox(height: 8),
              Text(
                subject.name,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
