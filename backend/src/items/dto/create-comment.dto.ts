import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(2, { message: 'O comentário deve ter pelo menos 2 caracteres.' })
  @MaxLength(500, { message: 'O comentário deve ter no máximo 500 caracteres.' })
  body: string;
}
