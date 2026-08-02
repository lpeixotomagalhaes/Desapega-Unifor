import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MinLength(2, { message: 'Informe seu curso.' })
  @MaxLength(120, { message: 'Curso deve ter no máximo 120 caracteres.' })
  course: string;

  @IsString()
  @MinLength(3, { message: 'Informe sua matrícula.' })
  @MaxLength(40, { message: 'Matrícula deve ter no máximo 40 caracteres.' })
  enrollment: string;

  @IsBoolean({ message: 'acceptListedPrice deve ser true ou false.' })
  acceptListedPrice: boolean;

  @ValidateIf((o: CreateOrderDto) => !o.acceptListedPrice)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Informe um valor válido.' })
  @Min(0, { message: 'O valor não pode ser negativo.' })
  offeredPrice?: number;

  @IsString()
  @MinLength(2, { message: 'Informe o dia do encontro.' })
  @MaxLength(80, { message: 'Dia deve ter no máximo 80 caracteres.' })
  meetupDay: string;

  @IsString()
  @MinLength(2, { message: 'Informe o horário do encontro.' })
  @MaxLength(40, { message: 'Horário deve ter no máximo 40 caracteres.' })
  meetupTime: string;

  @IsString()
  @MinLength(2, { message: 'Informe o bloco/local no campus.' })
  @MaxLength(80, { message: 'Bloco deve ter no máximo 80 caracteres.' })
  campusBlock: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  customBlock?: string;
}
