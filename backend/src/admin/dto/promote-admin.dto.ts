import { IsEmail } from 'class-validator';

export class PromoteAdminDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email: string;
}
