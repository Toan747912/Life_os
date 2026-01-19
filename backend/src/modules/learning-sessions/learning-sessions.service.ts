import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningSession } from './entities/learning-session.entity';
import { MistakeLog } from './entities/mistake-log.entity';

@Injectable()
export class LearningSessionsService {
    constructor(
        @InjectRepository(LearningSession)
        private sessionsRepository: Repository<LearningSession>,
        @InjectRepository(MistakeLog)
        private mistakesRepository: Repository<MistakeLog>,
    ) { }

    async create(createSessionDto: any) {
        // Basic implementation for saving session with mistakes
        const session = this.sessionsRepository.create(createSessionDto);
        return this.sessionsRepository.save(session);
    }

    async findAll(userId: string) {
        return this.sessionsRepository.find({
            where: { userId },
            relations: ['mistakes'],
            order: { startedAt: 'DESC' },
        });
    }
}
