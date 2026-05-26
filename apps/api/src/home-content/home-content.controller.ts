import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HomeContentService } from './home-content.service';

@ApiTags('home-content')
@Controller('home-content')
export class HomeContentController {
  constructor(private readonly homeContent: HomeContentService) {}

  @Get()
  get() {
    return this.homeContent.getPublic();
  }
}
