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
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { UserRole } from '../generated/prisma/enums';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
import { AdminTakeDownItemDto } from './dto/admin-take-down-item.dto';
import { ModerateUserDto } from './dto/moderate-user.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

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
    @Query('accountStatus') accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED',
  ) {
    return this.adminService.listUsers({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role,
      email,
      accountStatus,
    });
  }

  @Patch('users/:id/moderate')
  moderateUser(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ModerateUserDto,
  ) {
    return this.adminService.moderateUser(id, user.id, dto);
  }

  @Get('items')
  listItems(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'ATIVO' | 'NEGOCIANDO' | 'CONCLUIDO' | 'SUSPENSO',
    @Query('search') search?: string,
  ) {
    return this.adminService.listItems({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      search,
    });
  }

  @Patch('items/:id/take-down')
  takeDownItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdminTakeDownItemDto,
  ) {
    return this.adminService.takeDownItem(id, user.id, dto);
  }

  @Patch('items/:id/restore')
  restoreItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.restoreItem(id, user.id);
  }

  @Delete('items/:id')
  deleteItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdminTakeDownItemDto,
  ) {
    return this.adminService.deleteItem(id, user.id, dto);
  }

  @Get('admins')
  @Roles(UserRole.SUPER_ADMIN)
  listAdmins() {
    return this.adminService.listAdmins();
  }

  @Post('admins')
  @Roles(UserRole.SUPER_ADMIN)
  async promoteAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PromoteAdminDto,
  ) {
    const result = await this.adminService.promoteAdmin(dto);
    await this.auditService.create({
      actorId: user.id,
      action: 'ADMIN_PROMOTE',
      targetType: 'USER',
      targetId: result.id,
      summary: `Promovido a ADMIN: ${result.email}`,
      metadata: { email: result.email },
    });
    return result;
  }

  @Patch('admins/:id/revoke')
  @Roles(UserRole.SUPER_ADMIN)
  async revokeAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const result = await this.adminService.revokeAdmin(id);
    await this.auditService.create({
      actorId: user.id,
      action: 'ADMIN_REVOKE',
      targetType: 'USER',
      targetId: result.id,
      summary: `Admin revogado: ${result.email}`,
      metadata: { email: result.email },
    });
    return result;
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

  @Get('audit')
  listAudit(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      action,
    });
  }
}
