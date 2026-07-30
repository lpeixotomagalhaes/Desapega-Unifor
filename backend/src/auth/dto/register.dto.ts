import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsBrazilianPhone } from '../../common/validators/is-br-phone.validator';

export const PASSWORD_REGEX =
  /^(?=.*[A-Za-zÀ-ÿ])(?=.*\d)(?=.*[^A-Za-zÀ-ÿ0-9\s]).{8,72}$/;

export class RegisterDto {
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres.' })
  @MaxLength(80, { message: 'O nome deve ter no máximo 80 caracteres.' })
  name: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;

  @IsString()
  @Matches(PASSWORD_REGEX, {
    message:
      'A senha deve ter pelo menos 8 caracteres, com letra, número e caractere especial.',
  })
  password: string;

  @IsString({ message: 'Informe um WhatsApp válido.' })
  @IsBrazilianPhone()
  phone: string;
}
