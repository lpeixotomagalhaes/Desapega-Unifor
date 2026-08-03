import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryItemsDto } from './dto/query-items.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(@Query() query: QueryItemsDto) {
    return this.itemsService.findAll(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.findMine(user.id);
  }

  @Get('mine/interests')
  @UseGuards(JwtAuthGuard)
  findMyInterests(@CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.findMyInterests(user.id);
  }

  @Get('mine/orders')
  @UseGuards(JwtAuthGuard)
  findMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.findMyInterests(user.id);
  }

  @Get('mine/purchases')
  @UseGuards(JwtAuthGuard)
  findMyPurchases(@CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.findMyPurchases(user.id);
  }

  @Patch('orders/:orderId/status')
  @UseGuards(JwtAuthGuard)
  updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.itemsService.updateOrderStatus(user.id, orderId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.itemsService.listComments(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.itemsService.createComment(user.id, id, dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateItemDto) {
    return this.itemsService.create(user.id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateItemStatusDto,
  ) {
    return this.itemsService.updateStatus(user.id, id, dto);
  }

  @Post(':id/orders')
  @UseGuards(JwtAuthGuard)
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.itemsService.createOrder(user.id, id, dto);
  }

  /** @deprecated Prefer POST /items/:id/orders */
  @Post(':id/interest')
  @UseGuards(JwtAuthGuard)
  expressInterestLegacy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.itemsService.createOrder(user.id, id, {
      course: 'Não informado',
      enrollment: 'Não informado',
      acceptListedPrice: true,
      meetupDay: 'A combinar',
      meetupTime: 'A combinar',
      campusBlock: 'A combinar',
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.itemsService.remove(user.id, id);
  }
}
