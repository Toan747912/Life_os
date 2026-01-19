import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { FocusSessionStatus } from '../entities/focus-session.entity';

export class CreateFocusSessionDto {
  @IsISO8601()
  startTime: string;

  @IsISO8601()
  endTime: string;

  @IsInt()
  @Min(0)
  duration: number;

  @IsEnum(FocusSessionStatus)
  status: FocusSessionStatus;

  @IsUUID()
  @IsOptional()
  linkedEntityId?: string;
}
