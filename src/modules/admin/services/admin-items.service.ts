import { Injectable, BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";
import { ItemsRepository } from "../../items/repositories/items.repository";
import { CreateItemDto } from "../../items/dto/create-item.dto";
import { CategoryRepository } from "../../services/repositories/category.repository";

@Injectable()
export class AdminItemsService {
  constructor(
    private itemsRepository: ItemsRepository,
    private categoryRepository: CategoryRepository
  ) {}

  async createItem(itemData: CreateItemDto) {
    try {
      const category = await this.categoryRepository.findById(
        itemData.categoryId
      );

      if (!category) {
        throw new BadRequestException("Category not found");
      }

      return this.itemsRepository.create(itemData);
    } catch (error) {
      console.error("Error creating item:", error);
      throw new BadRequestException(error.message);
    }
  }

  async getItemsByCategory(categoryId: string) {
    return this.itemsRepository.findByCategory(categoryId);
  }
}
