import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';

export class CreateParticipationListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  score?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one level ID is required' })
  @IsUUID('4', { each: true, message: 'Each levelId must be a valid UUID' })
  levelIds: string[];
}
