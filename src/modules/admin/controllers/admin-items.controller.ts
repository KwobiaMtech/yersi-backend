import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { AdminApiKeyGuard } from '../guards/admin-api-key.guard';
import { ItemsRepository } from '../../items/repositories/items.repository';
import { CreateItemDto } from '../../items/dto/create-item.dto';

@ApiTags('Admin - Items')
@Controller('admin/items')
@UseGuards(AdminApiKeyGuard)
@ApiHeader({ name: 'x-admin-api-key', description: 'Admin API Key' })
export class AdminItemsController {
  constructor(private itemsRepository: ItemsRepository) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  async createItem(@Body() itemData: CreateItemDto) {
    const itemWithObjectId = {
      ...itemData,
      categoryId: new Types.ObjectId(itemData.categoryId)
    };
    return this.itemsRepository.create(itemWithObjectId);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get items by category' })
  async getItemsByCategory(@Param('categoryId') categoryId: string) {
    return this.itemsRepository.findByCategory(categoryId);
  }
}
