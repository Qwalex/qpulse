import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin/reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/reviews')
export class ReviewsAdminController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list() {
    return this.reviews.list();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviews.remove(id);
  }
}
