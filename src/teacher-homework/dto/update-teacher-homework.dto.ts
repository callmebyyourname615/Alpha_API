import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherHomeworkDto } from './create-teacher-homework.dto';

// classId is already inherited as optional from CreateTeacherHomeworkDto ✅
export class UpdateTeacherHomeworkDto extends PartialType(
  CreateTeacherHomeworkDto,
) {}