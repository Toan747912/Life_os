import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesService } from './entities.service';
import { EntitiesController } from './entities.controller';
import { UnifiedEntity } from './entities/entity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnifiedEntity])],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
