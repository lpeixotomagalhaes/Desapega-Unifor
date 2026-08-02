import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { UserRole } from '../generated/prisma/enums';
import { AdminService } from './admin.service';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: UserRole,
    @Query('email') email?: string,
  ) {
    return this.adminService.listUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role,
      email,
    });
  }

  @Get('admins')
  @Roles(UserRole.SUPER_ADMIN)
  listAdmins() {
    return this.adminService.listAdmins();
  }

  @Post('admins')
  @Roles(UserRole.SUPER_ADMIN)
  promoteAdmin(@Body() dto: PromoteAdminDto) {
    return this.adminService.promoteAdmin(dto);
  }

  @Patch('admins/:id/revoke')
  @Roles(UserRole.SUPER_ADMIN)
  revokeAdmin(@Param('id') id: string) {
    return this.adminService.revokeAdmin(id);
  }

  @Get('support')
  listTickets(@Query('status') status?: string) {
    return this.adminService.listTickets(status);
  }

  @Patch('support/:id')
  updateTicket(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSupportTicketDto,
  ) {
    return this.adminService.updateTicket(id, user.id, dto);
  }
}
