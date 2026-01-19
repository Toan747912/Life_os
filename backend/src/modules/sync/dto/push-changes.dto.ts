import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncEntityDto {
  @IsUUID()
  id: string;

  @IsString()
  type: string;

  @IsOptional()
  data: any; // JSON object

  @IsUUID()
  @IsOptional()
  workspace_id: string;

  @IsISO8601()
  created_at: string;

  @IsISO8601()
  updated_at: string;

  @IsOptional()
  parent_id?: string;

  @IsOptional()
  position?: string;

  @IsISO8601()
  @IsOptional()
  deleted_at?: string;
}

export class PushChangesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEntityDto)
  changes: SyncEntityDto[];

  @IsISO8601()
  last_pulled_at: string;
}
