import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ItemsService } from '../services/items.service';
import { GetItemsByCategoryDto, ItemResponseDto } from '../dto/item.dto';
import { ClothingCategory } from '../schemas/item.schema';

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

  @Get('categories')
  @ApiOperation({ summary: 'Get all clothing categories' })
  @CacheTTL(600) // Cache for 10 minutes
  async getCategories() {
    return this.itemsService.getAllCategories();
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get items by clothing category' })
  @ApiQuery({ name: 'category', enum: ClothingCategory, required: true })
  @ApiQuery({ name: 'service_id', required: false })
  @ApiResponse({ type: [ItemResponseDto] })
  @CacheTTL(300) // Cache for 5 minutes
  async getItemsByCategory(
    @Query('category') category: ClothingCategory,
    @Query('service_id') serviceId?: string
  ) {
    const categoryDto: GetItemsByCategoryDto = { category, serviceId };
    return this.itemsService.getItemsByCategory(categoryDto);
  }
}