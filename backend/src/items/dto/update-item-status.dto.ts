import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ItemStatus } from '../../generated/prisma/enums';

export class UpdateItemStatusDto {
  @IsEnum(ItemStatus, {
    message: `Status inválido. Use um de: ${Object.values(ItemStatus).join(', ')}.`,
  })
  status: ItemStatus;

  @IsOptional()
  @IsString()
  negotiatingWithId?: string;
}
