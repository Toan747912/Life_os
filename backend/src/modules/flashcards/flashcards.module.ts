import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsController } from './flashcards.controller';
import { Flashcard } from './entities/flashcard.entity';
import { ReviewLog } from './entities/review-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard, ReviewLog])],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
