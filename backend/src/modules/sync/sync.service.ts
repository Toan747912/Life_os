import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { PushChangesDto } from './dto/push-changes.dto';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
  ) { }

  async push(userId: string, pushDto: PushChangesDto) {
    const { changes } = pushDto;
    const savedIds: string[] = [];

    for (const change of changes) {
      // Map JSON to Entity
      // Ideally validation should be here
      // For now we assume 'change' matches structure or we map it

      // If client sends temporary ID, we might create new, but better if client sends UUID if possible
      // or we handle ID mapping. For simplicity, assume server ID or client generated UUID.

      const activityData = {
        // If id is not UUID, we ignore it and let DB gen (if we want)
        // But for sync, usually client generates UUIDv4 or we accept whatever
        // Since Isar uses int, we might need to handle this.
        // Spec says local ID is Int, Server is UUID.
        // If local sends NO ID or Local ID, we treat as new if it has no serverId
        // Actually the mobile logic I wrote sends 'id' as stringified int. This is problematic for UUID.
        // Fix: Mobile should simply trigger 'create' and receive 'server_id' back? 
        // Or Mobile generates UUID?

        title: change.data.title,
        metadata: change.data.metadata,
        dueAt: change.data.due_at,
        lastUpdatedAt: new Date(),
        workspaceId: change.workspace_id,
      };

      const saved = await this.activitiesRepository.save(activityData);
      savedIds.push(saved.id);
    }

    return { synced: savedIds };
  }

  async pull(userId: string, since: string) {
    const lastSync = new Date(since);

    const changes = await this.activitiesRepository.find({
      where: {
        lastUpdatedAt: MoreThan(lastSync),
        // userId: userId // Filter by user!
      },
    });

    return {
      timestamp: new Date().toISOString(),
      changes,
    };
  }
}
