import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { SavedItemsService } from './saved-items.service';

@Controller('saved-items')
@UseGuards(JwtAuthGuard)
export class SavedItemsController {
  constructor(private readonly savedItems: SavedItemsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.savedItems.listMine(user.id);
  }

  @Get('ids')
  listIds(@CurrentUser() user: AuthenticatedUser) {
    return this.savedItems.listIds(user.id);
  }

  @Post(':itemId')
  save(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
  ) {
    return this.savedItems.save(user.id, itemId);
  }

  @Delete(':itemId')
  unsave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
  ) {
    return this.savedItems.unsave(user.id, itemId);
  }
}
