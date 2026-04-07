import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
