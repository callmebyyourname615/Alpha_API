import { IsUUID } from 'class-validator';

export class ScanQrDto {
  @IsUUID()
  teacher_id: string;

  @IsUUID()
  student_id: string;
}