import { IsString, MinLength } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  @MinLength(10, { message: 'Token do Google inválido.' })
  idToken: string;
}
