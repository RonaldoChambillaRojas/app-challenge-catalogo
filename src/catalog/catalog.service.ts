import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { Producto } from './entities/producto.entity';
import { FamiliaProducto } from './entities/familia-producto.entity';
import type{
  ProductListItem,
  FamilyProducts,
  GeneratedCode,
} from './interfaces/catalog.interfaces';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(FamiliaProducto)
    private readonly familiaProductoRepository: Repository<FamiliaProducto>,
  ) {}

  /**
   * Obtener productos por categoría (familia)
   * Si no se envía idFamiliaProducto, devuelve todos los productos
   */
  async getProductsByCategory(
    idFamiliaProducto?: number,
  ): Promise<ProductListItem[]> {
    const queryBuilder = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.subFamiliaProducto', 'subFamilia')
      .leftJoinAndSelect('subFamilia.familiaProducto', 'familia')
      .where('producto.estadoProducto = :estado', { estado: '1' })
      .andWhere('producto.indicadorEstado = :indicador', { indicador: 'A' });

    // Si se proporciona el filtro de familia, agregarlo
    if (idFamiliaProducto) {
      queryBuilder.andWhere('familia.idFamiliaProducto = :idFamilia', {
        idFamilia: idFamiliaProducto,
      });
    }

    const productos = await queryBuilder.getMany();

    // Mapear a la interfaz de respuesta
    return productos.map((producto) => ({
      idProducto: producto.idProducto,
      nombre: producto.nombreProducto,
      familiaProducto:
        producto.subFamiliaProducto?.familiaProducto?.nombreFamiliaProducto ||
        'Sin categoría',
      precio: Number(producto.precioUnitario) || 0,
      foto: producto.foto || null,
    }));
  }

  /**
   * Obtener todas las familias de productos activas
   */
  async getFamilies(): Promise<FamilyProducts[]> {
    const familias = await this.familiaProductoRepository.find({
      where: {
        indicadorEstado: 'A',
        noEspecificado: 'N', // Excluir el registro "NO ESPECIFICADO"
      },
      order: {
        nombreFamiliaProducto: 'ASC',
      },
    });

    return familias.map((familia) => ({
      idFamiliaProducto: familia.idFamiliaProducto,
      nombreFamilia: familia.nombreFamiliaProducto,
    }));
  }

  /**
   * Generar un código único para un nuevo producto
   * Formato: PROD-YYYYMMDD-XXXXX (donde XXXXX es un número aleatorio)
   */
  async generateProductCode(): Promise<GeneratedCode> {
    let isUnique = false;
    let codigo = '';

    while (!isUnique) {
      // Generar código con formato: PROD-YYYYMMDD-XXXXX
      const fecha = new Date();
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const random = Math.floor(10000 + Math.random() * 90000); // Número de 5 dígitos

      codigo = `PROD-${year}${month}${day}-${random}`;

      // Verificar si el código ya existe
      const exists = await this.productoRepository.findOne({
        where: { codigoMercaderia: codigo },
      });

      if (!exists) {
        isUnique = true;
      }
    }

    return { codigo };
  }

  // Métodos que ya tenías (para mantener compatibilidad)
}