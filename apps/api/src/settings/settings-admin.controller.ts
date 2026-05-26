import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin/settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class SettingsAdminController {
  constructor(private readonly settings: SettingsService) {}

  @Get('menu-links')
  listMenu() {
    return this.settings.listMenuLinks();
  }

  @Post('menu-links')
  createMenu(@Body() body: Record<string, unknown>) {
    return this.settings.upsertMenuLink(body);
  }

  @Patch('menu-links/:id')
  updateMenu(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.settings.upsertMenuLink({ ...body, id });
  }

  @Delete('menu-links/:id')
  deleteMenu(@Param('id') id: string) {
    return this.settings.deleteMenuLink(id);
  }

  @Get('settings')
  getSettings() {
    return this.settings.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: Record<string, unknown>) {
    return this.settings.updateSettings(body);
  }
}
