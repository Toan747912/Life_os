import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { Subject } from './entities/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Subject])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
