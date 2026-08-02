import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @MinLength(1)
  orderId: string;

  @Type(() => Number)
  @IsInt({ message: 'A nota deve ser um número inteiro.' })
  @Min(1, { message: 'A nota mínima é 1.' })
  @Max(5, { message: 'A nota máxima é 5.' })
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'O comentário deve ter no máximo 500 caracteres.' })
  comment?: string;
}
