import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeworkResultDto } from './create-homework-result.dto';

export class UpdateHomeworkResultDto extends PartialType(
  CreateHomeworkResultDto,
) {}
