import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HomeContentService } from './home-content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin/home-content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/home-content')
export class HomeContentAdminController {
  constructor(private readonly homeContent: HomeContentService) {}

  @Get()
  get() {
    return this.homeContent.getPublic();
  }

  @Patch()
  update(@Body() body: Record<string, unknown>) {
    return this.homeContent.update(body);
  }
}
