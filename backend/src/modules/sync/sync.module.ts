import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { Activity } from '../activities/entities/activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule { }
