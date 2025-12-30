import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import {
  FamiliaProducto,
  LineaProducto,
  Marca,
  Modelo,
  Producto,
  SubFamiliaProducto,
} from './entities';
import { ImageProcessingService } from './services/image-processing.service';
import { GoogleImageSearchService } from './services/google-image-search.service';

@Module({
  imports: [
    ConfigModule, // Importar ConfigModule para usar variables de entorno
    TypeOrmModule.forFeature([
      FamiliaProducto,
      SubFamiliaProducto,
      LineaProducto,
      Marca,
      Modelo,
      Producto,
    ]),
  ],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    ImageProcessingService,
    GoogleImageSearchService, // ← Nuevo servicio
  ],
  exports: [
    CatalogService,
    ImageProcessingService,
    GoogleImageSearchService,
  ],
})
export class CatalogModule {}