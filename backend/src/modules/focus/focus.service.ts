import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FocusSession,
  FocusSessionStatus,
} from './entities/focus-session.entity';
import { CreateFocusSessionDto } from './dto/create-focus-session.dto';

@Injectable()
export class FocusService {
  constructor(
    @InjectRepository(FocusSession)
    private focusSessionRepository: Repository<FocusSession>,
  ) {}

  create(
    userId: string,
    createFocusSessionDto: CreateFocusSessionDto,
  ): Promise<FocusSession> {
    const session = this.focusSessionRepository.create({
      ...createFocusSessionDto,
      userId,
    });
    return this.focusSessionRepository.save(session);
  }

  findAll(userId: string): Promise<FocusSession[]> {
    return this.focusSessionRepository.find({
      where: { userId },
      order: { startTime: 'DESC' },
    });
  }

  async getStats(userId: string) {
    const sessions = await this.findAll(userId);
    const totalDuration = sessions.reduce(
      (sum, session) => sum + session.duration,
      0,
    );
    const completedSessions = sessions.filter(
      (s) => s.status === FocusSessionStatus.COMPLETED,
    ).length;

    return {
      totalSessions: sessions.length,
      completedSessions,
      totalDurationMinutes: Math.floor(totalDuration / 60),
    };
  }
}
