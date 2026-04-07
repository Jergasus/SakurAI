import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class IngestTextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;
}
