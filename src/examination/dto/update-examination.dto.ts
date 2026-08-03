import { PartialType } from '@nestjs/mapped-types';
import { CreateExaminationDto } from './create-examination.dto';

export class UpdateExaminationDto extends PartialType(CreateExaminationDto) {}