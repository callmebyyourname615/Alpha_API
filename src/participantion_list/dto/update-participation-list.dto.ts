import { PartialType } from '@nestjs/mapped-types';
import { CreateParticipationListDto } from './create-participation-list.dto';
import { IsOptional, IsArray, IsUUID } from 'class-validator';

export class UpdateParticipationListDto extends PartialType(CreateParticipationListDto) {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  levelIds?: string[];
}