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
import { GetProductsByCategoryDto } from './dto/get-products-by-category.dto';
import {
  FamilyProducts,
  GeneratedCode,
  PaginatedProductsResponse,
  ImageSearchResult,
  ImageDownloadResult,
} from './interfaces/catalog.interfaces';
import { ImageValidationInterceptor } from './interceptors/image-validation.interceptor';
import { ImageProcessingService } from './services/image-processing.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { OptionalImageValidationInterceptor } from './interceptors/OptionalImageValidation.interceptor';
import { SearchProductsDto } from './dto/searchProducts.dto';
import { SearchImageDto, DownloadImageDto } from './dto/search-image.dto';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  // ===== ENDPOINTS DE BÚSQUEDA DE IMÁGENES EN GOOGLE =====

  /**
   * POST /catalog/search-image
   * Buscar imágenes en Google para un producto
   * Body: { term: "nombre del producto", numResults?: 5 }
   */
  @Post('search-image')
  async searchImage(
    @Body() searchImageDto: SearchImageDto,
  ): Promise<ImageSearchResult> {
    return this.catalogService.searchImagesForProduct(
      searchImageDto.term,
      searchImageDto.numResults || 5,
    );
  }

  /**
   * POST /catalog/download-image
   * Descargar imagen desde URL y asociarla a un producto
   * Body: { imageUrl: "https://...", productId: 123 }
   */
  @Post('download-image')
  async downloadImage(
    @Body() downloadImageDto: DownloadImageDto,
  ): Promise<ImageDownloadResult> {
    return this.catalogService.downloadImageForProduct(
      downloadImageDto.imageUrl,
      downloadImageDto.productId,
    );
  }

  // ===== ENDPOINTS DE PRODUCTOS =====

  @Get('products/search')
  async searchProducts(
    @Query() searchDto: SearchProductsDto,
  ): Promise<PaginatedProductsResponse> {
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 10;
    const idFamilia = searchDto.idFamiliaProducto;

    return this.catalogService.searchProducts(
      searchDto.term,
      page,
      limit,
      idFamilia,
    );
  }

  @Get('products')
  async getProductsByCategory(
    @Query() query: GetProductsByCategoryDto,
  ): Promise<PaginatedProductsResponse> {
    const idFamilia = query.idFamiliaProducto
      ? parseInt(query.idFamiliaProducto, 10)
      : undefined;
    
    const page = query.page || 1;
    const limit = query.limit || 10;

    return this.catalogService.getProductsByCategory(idFamilia, page, limit);
  }

  @Post('product')
  @UseInterceptors(
    FileInterceptor('image'),
    ImageValidationInterceptor
  )
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ message: string; producto: any }> {
    return this.catalogService.createProduct(createProductDto, file);
  }

  @Patch('product/:id')
  @UseInterceptors(
    FileInterceptor('image'),
    OptionalImageValidationInterceptor 
  )
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    await this.catalogService.updateProduct(id, updateProductDto, file);
    return {
      message: 'Producto actualizado exitosamente',
      statusCode: 200,
    };
  }

  @Get('families')
  async getFamilies(): Promise<FamilyProducts[]> {
    return this.catalogService.getFamilies();
  }

  @Get('generate-code')
  async generateProductCode(): Promise<GeneratedCode> {
    return this.catalogService.generateProductCode();
  }

  // ===== ENDPOINTS DE IMÁGENES =====

  @Post('products/:id/image')
  @UseInterceptors(FileInterceptor('image'), ImageValidationInterceptor)
  async uploadProductImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.catalogService.uploadProductImage(id, file);
  }

  @Delete('products/:id/image')
  async deleteProductImage(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.deleteProductImage(id);
  }

  @Get('images/:filename')
  async serveImage(
    @Param('filename') filename: string,
    @Query('size') size: 'thumbnails' | 'medium' | 'original' = 'medium',
    @Res() res: Response,
  ) {
    const validSizes = ['thumbnails', 'medium', 'original'];
    if (!validSizes.includes(size)) {
      size = 'medium';
    }

    if (!this.imageProcessingService.imageExists(filename, size)) {
      throw new NotFoundException('Imagen no encontrada');
    }

    const imagePath = this.imageProcessingService.getImagePath(filename, size);
    res.sendFile(imagePath);
  }
}