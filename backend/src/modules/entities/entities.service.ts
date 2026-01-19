import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnifiedEntity } from './entities/entity.entity';
import { CreateEntityDto } from './dto/create-entity.dto';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(UnifiedEntity)
    private entitiesRepository: Repository<UnifiedEntity>,
  ) {}

  create(
    workspaceId: string,
    createEntityDto: CreateEntityDto,
  ): Promise<UnifiedEntity> {
    const entity = this.entitiesRepository.create({
      ...createEntityDto,
      workspaceId,
    });
    return this.entitiesRepository.save(entity);
  }

  findAll(workspaceId: string): Promise<UnifiedEntity[]> {
    return this.entitiesRepository.find({
      where: { workspaceId },
      order: { position: 'ASC', createdAt: 'DESC' },
    });
  }

  findOne(id: string): Promise<UnifiedEntity | null> {
    return this.entitiesRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    updateData: Partial<CreateEntityDto>,
  ): Promise<UnifiedEntity | null> {
    // For JSONB, verify if we want deep merge or replacement.
    // TypeORM's save/update might replace the json object.
    // For simple "patch", we can do:
    const existing = await this.findOne(id);
    if (!existing) return null;

    if (updateData.data) {
      existing.data = { ...existing.data, ...updateData.data };
    }
    if (updateData.position) existing.position = updateData.position;
    if (updateData.parentId !== undefined)
      existing.parentId = updateData.parentId;

    return this.entitiesRepository.save(existing);
  }

  async remove(id: string): Promise<void> {
    await this.entitiesRepository.delete(id);
  }
}
