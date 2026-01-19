import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { CardType } from '../entities/flashcard.entity';

export class CreateFlashcardDto {
  @IsString()
  frontContent: string;

  @IsString()
  backContent: string;

  @IsEnum(CardType)
  @IsOptional()
  cardType?: CardType;

  @IsUUID()
  @IsOptional()
  noteId?: string;
}

export class ReviewFlashcardDto {
  @IsNumber()
  @Min(0)
  @Max(5)
  quality: number; // 0-5
}
