import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Category } from '../../generated/prisma/enums';

export class QueryItemsDto {
  @IsOptional()
  @IsEnum(Category, {
    message: `Categoria inválida. Use uma de: ${Object.values(Category).join(', ')}.`,
  })
  category?: Category;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
