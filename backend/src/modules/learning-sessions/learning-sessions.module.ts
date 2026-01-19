import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningSession } from './entities/learning-session.entity';
import { MistakeLog } from './entities/mistake-log.entity';
import { LearningSessionsController } from './learning-sessions.controller';
import { LearningSessionsService } from './learning-sessions.service';

@Module({
    imports: [TypeOrmModule.forFeature([LearningSession, MistakeLog])],
    controllers: [LearningSessionsController],
    providers: [LearningSessionsService],
    exports: [LearningSessionsService],
})
export class LearningSessionsModule { }
