import { IsString, IsNotEmpty } from 'class-validator';

export class IngestTextDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
