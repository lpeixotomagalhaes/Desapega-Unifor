import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SupportTicketStatus } from '../../generated/prisma/enums';

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus, {
    message: `Status inválido. Use: ${Object.values(SupportTicketStatus).join(', ')}.`,
  })
  status?: SupportTicketStatus;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'A resposta não pode ser vazia.' })
  @MaxLength(2000, {
    message: 'A resposta deve ter no máximo 2000 caracteres.',
  })
  adminReply?: string;
}
