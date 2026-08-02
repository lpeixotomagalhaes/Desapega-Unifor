import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: `Status inválido. Use: ${Object.values(OrderStatus).join(', ')}.`,
  })
  status: OrderStatus;
}
