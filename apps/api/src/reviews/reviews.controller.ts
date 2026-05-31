import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';

function mapReview(review: {
  id: string;
  rating: number;
  comment: string | null;
  deviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    deviceId: review.deviceId,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Get('mine')
  async mine(@Query('deviceId') deviceId?: string) {
    if (!deviceId?.trim()) {
      throw new BadRequestException('deviceId is required');
    }
    const review = await this.reviews.findByDeviceId(deviceId.trim());
    return { review: review ? mapReview(review) : null };
  }

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Post()
  async upsert(@Body() body: { rating: number; comment?: string; deviceId?: string }) {
    const review = await this.reviews.upsert(body);
    return mapReview(review);
  }
}
