import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsAdminController } from './reviews-admin.controller';

@Module({
  controllers: [ReviewsController, ReviewsAdminController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
