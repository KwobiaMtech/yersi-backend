import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../guards/admin-api-key.guard';
import { CreateItemDto } from '../../items/dto/create-item.dto';
import { AdminItemsService } from '../services/admin-items.service';

@ApiTags('Admin - Items')
@Controller('admin/items')
@UseGuards(AdminApiKeyGuard)
@ApiHeader({ name: 'x-admin-api-key', description: 'Admin API Key' })
export class AdminItemsController {
  constructor(private adminItemsService: AdminItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  async createItem(@Body() itemData: CreateItemDto) {
    return this.adminItemsService.createItem(itemData);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get items by category' })
  async getItemsByCategory(@Param('categoryId') categoryId: string) {
    return this.adminItemsService.getItemsByCategory(categoryId);
  }
}
