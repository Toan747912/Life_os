import 'package:flutter/material.dart';
import '../../data/models/entity_model.dart';

class DynamicEntityList extends StatelessWidget {
  final List<UnifiedEntity> entities;

  const DynamicEntityList({super.key, required this.entities});

  @override
  Widget build(BuildContext context) {
    if (entities.isEmpty) {
      return const Center(child: Text('No items yet'));
    }

    return ListView.builder(
      itemCount: entities.length,
      itemBuilder: (context, index) {
        final entity = entities[index];
        return _buildEntityItem(entity);
      },
    );
  }

  Widget _buildEntityItem(UnifiedEntity entity) {
    switch (entity.type) {
      case 'task':
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: ListTile(
            leading: const Icon(Icons.check_circle_outline),
            title: Text(entity.data['title'] ?? 'Untitled Task'),
            subtitle: Text(entity.data['status'] ?? 'Todo'),
            trailing: const Icon(Icons.more_vert),
          ),
        );
      case 'note':
        return Card(
          color: Colors.amber[50],
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: ListTile(
            leading: const Icon(Icons.note, color: Colors.amber),
            title: Text(entity.data['title'] ?? 'Untitled Note'),
            subtitle: Text(
              entity.data['content'] ?? '',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        );
      default:
        return ListTile(
          leading: const Icon(Icons.help_outline),
          title: Text(entity.type.toUpperCase()),
          subtitle: Text(entity.id),
        );
    }
  }
}
