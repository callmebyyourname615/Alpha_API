import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class CheckConflictsDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  from_time: string;

  @IsString()
  @IsNotEmpty()
  to_time: string;

  @IsArray()
  @IsString({ each: true })
  person_ids: string[];
}
