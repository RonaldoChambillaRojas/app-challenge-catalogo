import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { GetProductsByCategoryDto } from './dto/get-products-by-category.dto';
import {
  ProductListItem,
  FamilyProducts,
  GeneratedCode,
} from './interfaces/catalog.interfaces';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ===== NUEVOS ENDPOINTS =====

  /**
   * GET /catalog/products
   * Obtener productos, opcionalmente filtrados por categoría
   * Query param: idFamiliaProducto (opcional)
   */
  @Get('products')
  async getProductsByCategory(
    @Query() query: GetProductsByCategoryDto,
  ): Promise<ProductListItem[]> {
    const idFamilia = query.idFamiliaProducto
      ? parseInt(query.idFamiliaProducto, 10)
      : undefined;
    return this.catalogService.getProductsByCategory(idFamilia);
  }

  /**
   * GET /catalog/families
   * Obtener todas las familias/categorías de productos
   */
  @Get('families')
  async getFamilies(): Promise<FamilyProducts[]> {
    return this.catalogService.getFamilies();
  }

  /**
   * GET /catalog/generate-code
   * Generar un código único para un nuevo producto
   */
  @Get('generate-code')
  async generateProductCode(): Promise<GeneratedCode> {
    return this.catalogService.generateProductCode();
  }

  // ===== ENDPOINTS ORIGINALES (para mantener) =====
}