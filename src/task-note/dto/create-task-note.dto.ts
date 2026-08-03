import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTaskNoteDto {
  @IsUUID()
  task_id: string;

  @IsUUID()
  admin_id: string;

  @IsString()
  @IsNotEmpty()
  note: string;
}
