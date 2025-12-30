import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { FamiliaProducto, LineaProducto, Marca, Modelo, Producto, SubFamiliaProducto } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageProcessingService } from './services/image-processing.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    FamiliaProducto,
    SubFamiliaProducto,
    LineaProducto,
    Marca,
    Modelo,
    Producto,
  ])],
  controllers: [CatalogController],
  providers: [CatalogService, ImageProcessingService],
  exports: [CatalogService, ImageProcessingService],
})
export class CatalogModule {}
