import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
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
  @MaxLength(1000, {
    message: 'A descrição deve ter no máximo 1000 caracteres.',
  })
  description: string;

  @IsArray({ message: 'Envie pelo menos uma categoria.' })
  @ArrayMinSize(1, { message: 'Escolha pelo menos uma categoria.' })
  @ArrayUnique({ message: 'Categorias duplicadas não são permitidas.' })
  @IsEnum(Category, {
    each: true,
    message: `Categoria inválida. Use uma de: ${Object.values(Category).join(', ')}.`,
  })
  categories: Category[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O preço deve ser um número.' })
  @Min(0, { message: 'O preço não pode ser negativo.' })
  price?: number;

  @IsOptional()
  @IsBoolean({ message: 'isDonation deve ser true ou false.' })
  isDonation?: boolean;

  /** Aceita upload local (`/uploads/...`) ou URL remota (seed/demo). */
  @IsString()
  @Matches(/^(https?:\/\/.+|\/uploads\/.+)$/i, {
    message: 'Envie uma imagem válida (upload ou URL).',
  })
  imageUrl: string;
}
