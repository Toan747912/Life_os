import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspacesRepository: Repository<Workspace>,
  ) {}

  create(
    createWorkspaceDto: CreateWorkspaceDto,
    ownerId: string,
  ): Promise<Workspace> {
    const workspace = this.workspacesRepository.create({
      ...createWorkspaceDto,
      ownerId,
    });
    return this.workspacesRepository.save(workspace);
  }

  findAll(ownerId: string): Promise<Workspace[]> {
    return this.workspacesRepository.find({
      where: { ownerId },
      order: { createdAt: 'ASC' },
    });
  }

  findOne(id: string): Promise<Workspace | null> {
    return this.workspacesRepository.findOne({ where: { id } });
  }
}
