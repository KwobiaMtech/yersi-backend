import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ItemsService } from '../services/items.service';

@ApiTags('Items')
@Controller('items')
@UseInterceptors(CacheInterceptor)
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get items by service type' })
  @ApiQuery({ name: 'service_id', required: true })
  @CacheTTL(300) // Cache for 5 minutes
  async getItems(@Query('service_id') serviceId: string) {
    return this.itemsService.getItemsByService(serviceId);
  }
}