import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService, AuditService, RolesGuard],
})
export class AdminModule {}
