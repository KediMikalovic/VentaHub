import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Soru boş olamaz.' })
  @MaxLength(500, { message: 'Soru en fazla 500 karakter olabilir.' })
  question: string;
}
