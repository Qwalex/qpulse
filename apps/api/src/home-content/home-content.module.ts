import { Module } from '@nestjs/common';
import { HomeContentService } from './home-content.service';
import { HomeContentController } from './home-content.controller';
import { HomeContentAdminController } from './home-content-admin.controller';

@Module({
  controllers: [HomeContentController, HomeContentAdminController],
  providers: [HomeContentService],
})
export class HomeContentModule {}
