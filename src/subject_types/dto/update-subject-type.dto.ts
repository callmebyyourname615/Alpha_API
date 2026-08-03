import { PartialType } from '@nestjs/mapped-types';
import { CreateSubjectTypeDto } from './create-subject-type.dto';

export class UpdateSubjectTypeDto extends PartialType(CreateSubjectTypeDto) {}