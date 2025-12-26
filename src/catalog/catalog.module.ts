import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { FamiliaProducto, LineaProducto, Marca, Modelo, Producto, SubFamiliaProducto } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';

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
  providers: [CatalogService],
})
export class CatalogModule {}
