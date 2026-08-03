import { PartialType } from '@nestjs/mapped-types';
import { CreateExaminationResultDto } from './create-examination-result.dto';

export class UpdateExaminationResultDto extends PartialType(
  CreateExaminationResultDto,
) {}