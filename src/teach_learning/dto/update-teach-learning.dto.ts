import { PartialType } from '@nestjs/mapped-types';
import { CreateTeachLearningDto } from './create-teach-learning.dto';

export class UpdateTeachLearningDto extends PartialType(CreateTeachLearningDto) {}