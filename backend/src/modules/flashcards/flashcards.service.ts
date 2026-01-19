import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flashcard } from './entities/flashcard.entity';
import {
  CreateFlashcardDto,
  ReviewFlashcardDto,
} from './dto/create-flashcard.dto';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectRepository(Flashcard)
    private flashcardRepository: Repository<Flashcard>,
  ) {}

  async create(
    userId: string,
    createFlashcardDto: CreateFlashcardDto,
  ): Promise<Flashcard> {
    const flashcard = this.flashcardRepository.create({
      ...createFlashcardDto,
      userId,
    });
    return this.flashcardRepository.save(flashcard);
  }

  async findAll(userId: string): Promise<Flashcard[]> {
    return this.flashcardRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findDue(userId: string): Promise<Flashcard[]> {
    const now = new Date();
    return this.flashcardRepository
      .createQueryBuilder('flashcard')
      .where('flashcard.userId = :userId', { userId })
      .andWhere('flashcard.nextReviewDate <= :now', { now })
      .orderBy('flashcard.nextReviewDate', 'ASC')
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<Flashcard> {
    const flashcard = await this.flashcardRepository.findOne({
      where: { id, userId },
    });
    if (!flashcard) {
      throw new NotFoundException(`Flashcard #${id} not found`);
    }
    return flashcard;
  }

  async update(
    id: string,
    userId: string,
    updateFlashcardDto: any,
  ): Promise<Flashcard> {
    // generic update
    const flashcard = await this.findOne(id, userId);
    Object.assign(flashcard, updateFlashcardDto);
    return this.flashcardRepository.save(flashcard);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.flashcardRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Flashcard #${id} not found`);
    }
  }

  // SM-2 Algorithm Implementation (Simplified)
  async review(
    id: string,
    userId: string,
    reviewDto: ReviewFlashcardDto,
  ): Promise<Flashcard> {
    const flashcard = await this.findOne(id, userId);
    const { quality } = reviewDto;

    // SM-2 Logic
    // quality: 0-5
    // 0-2: incorrect, 3-5: correct

    if (quality >= 3) {
      if (flashcard.repetition === 0) {
        flashcard.interval = 1;
      } else if (flashcard.repetition === 1) {
        flashcard.interval = 6;
      } else {
        flashcard.interval = Math.round(
          flashcard.interval * flashcard.easeFactor,
        );
      }
      flashcard.repetition += 1;
    } else {
      flashcard.repetition = 0;
      flashcard.interval = 1;
    }

    flashcard.easeFactor =
      flashcard.easeFactor +
      (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (flashcard.easeFactor < 1.3) flashcard.easeFactor = 1.3;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + flashcard.interval);
    flashcard.nextReviewDate = nextDate;

    return this.flashcardRepository.save(flashcard);
  }
}
