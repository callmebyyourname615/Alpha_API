import { IsUUID } from 'class-validator';

export class GetClassBalanceStudentsDto {
  @IsUUID()
  class_id: string;
}