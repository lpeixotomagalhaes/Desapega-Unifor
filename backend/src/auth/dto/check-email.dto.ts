import { IsEmail } from 'class-validator';

export class CheckEmailDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;
}
