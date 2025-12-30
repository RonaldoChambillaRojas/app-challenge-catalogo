import { 
  Injectable ,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
import { ImageProcessingService } from './services/image-processing.service';
import { SubFamiliaProducto } from './entities';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(FamiliaProducto)
    private readonly familiaProductoRepository: Repository<FamiliaProducto>,
    private readonly imageProcessingService: ImageProcessingService,
    @InjectRepository(SubFamiliaProducto)
    private readonly subFamiliaProductoRepository: Repository<SubFamiliaProducto>,
  ) {}



  async createProduct(createProductDto: CreateProductDto): Promise<void> {
  // 1. Buscar la familia por ID (ya que envías un número)
  const familia = await this.familiaProductoRepository.findOne({
    where: { idFamiliaProducto: createProductDto.FamiliaProducto } 
  });

  if (!familia) {
    throw new NotFoundException('Familia de producto no encontrada');
  }

  // 2. Buscar o crear una subfamilia "NO ESPECIFICADO" para esta familia
  let subFamilia = await this.subFamiliaProductoRepository.findOne({
    where: { 
      idFamiliaProducto: familia.idFamiliaProducto,
      nombreSubFamiliaProducto: 'NO ESPECIFICADO'
    }
  });

  // Si no existe, crearla
  if (!subFamilia) {
    subFamilia = this.subFamiliaProductoRepository.create({
      nombreSubFamiliaProducto: 'NO ESPECIFICADO',
      idFamiliaProducto: familia.idFamiliaProducto,
      noEspecificado: 'S',
      indicadorEstado: 'A',
      usuarioRegistro: 'ADMIN'
    });
    await this.subFamiliaProductoRepository.save(subFamilia);
  }

  // 3. Crear el producto con la subfamilia encontrada/creada
  const nuevoProducto = this.productoRepository.create({
    codigoMercaderia: createProductDto.codigoMercaderia,
    nombreProducto: createProductDto.nombre,
    precioUnitario: createProductDto.precio,
    foto: createProductDto.foto,
    idSubFamiliaProducto: subFamilia.idSubFamiliaProducto,
  });

  await this.productoRepository.save(nuevoProducto);
}



async updateProduct(id: number, updateProductDto: UpdateProductDto): Promise<void> {
  // 1. Verificar que el producto existe
  const producto = await this.productoRepository.findOne({
    where: { idProducto: id }
  });

  if (!producto) {
    throw new NotFoundException('Producto no encontrado');
  }

  // 2. Si se envía una nueva familia, buscar/crear subfamilia "NO ESPECIFICADO"
  let idSubFamiliaProducto = producto.idSubFamiliaProducto; // Mantener el actual por defecto

  if (updateProductDto.FamiliaProducto) {
    const familia = await this.familiaProductoRepository.findOne({
      where: { idFamiliaProducto: updateProductDto.FamiliaProducto }
    });

    if (!familia) {
      throw new NotFoundException('Familia de producto no encontrada');
    }

    // Buscar o crear subfamilia "NO ESPECIFICADO" para esta familia
    let subFamilia = await this.subFamiliaProductoRepository.findOne({
      where: { 
        idFamiliaProducto: familia.idFamiliaProducto,
        nombreSubFamiliaProducto: 'NO ESPECIFICADO'
      }
    });

    if (!subFamilia) {
      subFamilia = this.subFamiliaProductoRepository.create({
        nombreSubFamiliaProducto: 'NO ESPECIFICADO',
        idFamiliaProducto: familia.idFamiliaProducto,
        noEspecificado: 'S',
        indicadorEstado: 'A',
        usuarioRegistro: 'ADMIN'
      });
      await this.subFamiliaProductoRepository.save(subFamilia);
    }

    idSubFamiliaProducto = subFamilia.idSubFamiliaProducto;
  }

  // 3. Actualizar el producto
  await this.productoRepository.update(id, {
    nombreProducto: updateProductDto.nombre || producto.nombreProducto,
    precioUnitario: updateProductDto.precio || producto.precioUnitario,
    foto: updateProductDto.foto || producto.foto,
    idSubFamiliaProducto: idSubFamiliaProducto,
    usuarioModificacion: 'ADMIN', // O el usuario actual
    fechaModificacion: new Date(),
  });
}

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
      queryBuilder.andWhere('familia.IdFamiliaProducto = :idFamilia', {
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
      precio: producto.precioUnitario || 0,
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
  /**
   * Subir imagen de producto
   * @param productId - ID del producto
   * @param file - Archivo de imagen
   */
  async uploadProductImage(
    productId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string; filename: string; url: string }> {
    // Verificar que el producto existe
    const producto = await this.productoRepository.findOne({
      where: { idProducto: productId },
    });

    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${productId} no encontrado`,
      );
    }

    // Si ya tiene una imagen, eliminarla
    if (producto.foto) {
      await this.imageProcessingService.deleteImage(producto.foto);
    }

    // Procesar y guardar nueva imagen
    const filename = await this.imageProcessingService.processAndSaveImage(
      file,
      productId,
    );

    // Actualizar producto en BD
    await this.productoRepository.update(productId, {
      foto: filename,
      usuarioModificacion: 'SYSTEM', // Puedes cambiarlo por el usuario actual
      fechaModificacion: new Date(),
    });

    return {
      message: 'Imagen subida exitosamente',
      filename,
      url: `/catalog/images/${filename}`,
    };
  }

  /**
   * Eliminar imagen de producto
   * @param productId - ID del producto
   */
  async deleteProductImage(productId: number): Promise<{ message: string }> {
    const producto = await this.productoRepository.findOne({
      where: { idProducto: productId },
    });

    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${productId} no encontrado`,
      );
    }

    if (!producto.foto) {
      throw new BadRequestException('El producto no tiene imagen');
    }

    // Eliminar archivos físicos
    await this.imageProcessingService.deleteImage(producto.foto);

    // Actualizar BD
    await this.productoRepository.update(productId, {
      foto: null,
      usuarioModificacion: 'SYSTEM',
      fechaModificacion: new Date(),
    });

    return { message: 'Imagen eliminada exitosamente' };
  }
}