import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum ModerateUserAction {
  BAN = 'BAN',
  SUSPEND = 'SUSPEND',
  RESTORE = 'RESTORE',
}

export class ModerateUserDto {
  @IsEnum(ModerateUserAction, {
    message: 'Ação inválida. Use BAN, SUSPEND ou RESTORE.',
  })
  action!: ModerateUserAction;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Informe um motivo com pelo menos 3 caracteres.' })
  @MaxLength(500, { message: 'O motivo deve ter no máximo 500 caracteres.' })
  reason?: string;

  /** Dias de suspensão (obrigatório para SUSPEND). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  /** Ao banir/suspender, remove anúncios ativos do feed. */
  @IsOptional()
  @IsBoolean()
  takeDownItems?: boolean;
}
