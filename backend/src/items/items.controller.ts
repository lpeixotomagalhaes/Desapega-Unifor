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
import { CreateItemDto } from './dto/create-item.dto';
import { QueryItemsDto } from './dto/query-items.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
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

  @Get('mine/purchases')
  @UseGuards(JwtAuthGuard)
  findMyPurchases(@CurrentUser() user: AuthenticatedUser) {
    return this.itemsService.findMyPurchases(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
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

  @Post(':id/interest')
  @UseGuards(JwtAuthGuard)
  expressInterest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.itemsService.expressInterest(user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.itemsService.remove(user.id, id);
  }
}
