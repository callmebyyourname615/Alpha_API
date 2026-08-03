import { IsString } from 'class-validator';

export class LoginParentDto {
  @IsString()
  email: string;

  @IsString()
  password: string;
}
