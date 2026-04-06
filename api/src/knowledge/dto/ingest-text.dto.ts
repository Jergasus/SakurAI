import { IsString, IsNotEmpty } from 'class-validator';

export class IngestTextDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
