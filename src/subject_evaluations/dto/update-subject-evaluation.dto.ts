import { PartialType } from '@nestjs/mapped-types';
import { CreateSubjectEvaluationDto } from './create-subject-evaluation.dto';

export class UpdateSubjectEvaluationDto extends PartialType(CreateSubjectEvaluationDto) {}