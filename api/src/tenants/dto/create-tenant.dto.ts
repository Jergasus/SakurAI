import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  niche?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedTools?: string[];
}
