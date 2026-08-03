import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTaskNoteDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}
