import { PartialType } from '@nestjs/mapped-types';
import { CreateParentDto } from './CreateParentDto';

export class UpdateParentDto extends PartialType(CreateParentDto) {}