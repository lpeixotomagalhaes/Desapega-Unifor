import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Category } from '../../generated/prisma/enums';

export class CreateItemDto {
  @IsString()
  @MinLength(3, { message: 'O título deve ter pelo menos 3 caracteres.' })
  @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres.' })
  title: string;

  @IsString()
  @MinLength(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' })
  @MaxLength(1000, { message: 'A descrição deve ter no máximo 1000 caracteres.' })
  description: string;

  @IsEnum(Category, {
    message: `Categoria inválida. Use uma de: ${Object.values(Category).join(', ')}.`,
  })
  category: Category;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O preço deve ser um número.' })
  @Min(0, { message: 'O preço não pode ser negativo.' })
  price?: number;

  @IsOptional()
  @IsBoolean({ message: 'isDonation deve ser true ou false.' })
  isDonation?: boolean;

  @IsUrl({}, { message: 'Informe uma URL de imagem válida.' })
  imageUrl: string;
}
