import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CatalogService } from './catalog.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { GetProductsByCategoryDto } from './dto/get-products-by-category.dto';
import {
  ProductListItem,
  FamilyProducts,
  GeneratedCode,
} from './interfaces/catalog.interfaces';
import { ImageValidationInterceptor } from './interceptors/image-validation.interceptor';
import { ImageProcessingService } from './services/image-processing.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

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
  // ===== ENDPOINTS DE IMÁGENES =====

  /**
   * POST /catalog/products/:id/image
   * Subir imagen para un producto
   */
  @Post('products/:id/image')
  @UseInterceptors(FileInterceptor('image'), ImageValidationInterceptor)
  async uploadProductImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.catalogService.uploadProductImage(id, file);
  }

  /**
   * DELETE /catalog/products/:id/image
   * Eliminar imagen de un producto
   */
  @Delete('products/:id/image')
  async deleteProductImage(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.deleteProductImage(id);
  }

  /**
   * GET /catalog/images/:filename
   * Servir imagen (por defecto tamaño medium)
   * Query params:
   * - size: thumbnails | medium | original (default: medium)
   */
  @Get('images/:filename')
  async serveImage(
    @Param('filename') filename: string,
    @Query('size') size: 'thumbnails' | 'medium' | 'original' = 'medium',
    @Res() res: Response,
  ) {
    // Validar que el size sea válido
    const validSizes = ['thumbnails', 'medium', 'original'];
    if (!validSizes.includes(size)) {
      size = 'medium';
    }

    // Verificar que la imagen existe
    if (!this.imageProcessingService.imageExists(filename, size)) {
      throw new NotFoundException('Imagen no encontrada');
    }

    // Obtener ruta y enviar archivo
    const imagePath = this.imageProcessingService.getImagePath(filename, size);
    res.sendFile(imagePath);
  }
}
