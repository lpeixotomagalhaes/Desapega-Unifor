import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
