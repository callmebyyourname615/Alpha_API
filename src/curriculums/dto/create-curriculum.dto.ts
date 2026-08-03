import { IsString } from 'class-validator';

export class CreateCurriculumDto {

  @IsString()
  name: string;

}