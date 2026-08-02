import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsBrazilianPhone } from '../../common/validators/is-br-phone.validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres.' })
  @MaxLength(80, { message: 'O nome deve ter no máximo 80 caracteres.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Informe um WhatsApp válido.' })
  @IsBrazilianPhone()
  phone?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL de avatar inválida.' })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'A bio deve ter no máximo 280 caracteres.' })
  bio?: string;
}
