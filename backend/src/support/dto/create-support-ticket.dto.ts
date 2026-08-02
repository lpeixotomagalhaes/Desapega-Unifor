import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(3, { message: 'O assunto deve ter pelo menos 3 caracteres.' })
  @MaxLength(120, { message: 'O assunto deve ter no máximo 120 caracteres.' })
  subject: string;

  @IsString()
  @MinLength(10, { message: 'A mensagem deve ter pelo menos 10 caracteres.' })
  @MaxLength(2000, {
    message: 'A mensagem deve ter no máximo 2000 caracteres.',
  })
  message: string;
}
