import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateItemStatusDto {
  @IsIn(['ATIVO', 'NEGOCIANDO', 'CONCLUIDO'], {
    message: 'Status inválido. Use ATIVO, NEGOCIANDO ou CONCLUIDO.',
  })
  status: 'ATIVO' | 'NEGOCIANDO' | 'CONCLUIDO';

  @IsOptional()
  @IsString()
  negotiatingWithId?: string;
}
