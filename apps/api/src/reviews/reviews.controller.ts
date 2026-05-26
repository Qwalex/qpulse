import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Post()
  create(@Body() body: { rating: number; comment?: string; deviceId?: string }) {
    return this.reviews.create(body);
  }
}
