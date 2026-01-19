import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class CreateEntityDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  data: Record<string, any>;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  position?: string;
}
