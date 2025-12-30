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
  PaginatedProductsResponse,
  PaginationMeta,
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



  async createProduct(
  createProductDto: CreateProductDto,
  file?: Express.Multer.File,
): Promise<{ message: string; producto: any }> {
  // 1. Buscar la familia por ID
  const familia = await this.familiaProductoRepository.findOne({
    where: { idFamiliaProducto: createProductDto.FamiliaProducto },
  });

  if (!familia) {
    throw new NotFoundException('Familia de producto no encontrada');
  }

  // 2. Buscar o crear subfamilia "NO ESPECIFICADO"
  let subFamilia = await this.subFamiliaProductoRepository.findOne({
    where: {
      idFamiliaProducto: familia.idFamiliaProducto,
      nombreSubFamiliaProducto: 'NO ESPECIFICADO',
    },
  });

  if (!subFamilia) {
    subFamilia = this.subFamiliaProductoRepository.create({
      nombreSubFamiliaProducto: 'NO ESPECIFICADO',
      idFamiliaProducto: familia.idFamiliaProducto,
      noEspecificado: 'S',
      indicadorEstado: 'A',
      usuarioRegistro: 'ADMIN',
    });
    await this.subFamiliaProductoRepository.save(subFamilia);
  }

  // 3. Crear el producto (sin imagen por ahora)
  const nuevoProducto = this.productoRepository.create({
    codigoMercaderia: createProductDto.codigoMercaderia,
    nombreProducto: createProductDto.nombre,
    precioUnitario: createProductDto.precio,
    idSubFamiliaProducto: subFamilia.idSubFamiliaProducto,
    foto: null, // Inicialmente null
  });

  // Guardar producto para obtener el ID
  const productoGuardado = await this.productoRepository.save(nuevoProducto);

  // 4. Si se envió una imagen, procesarla y actualizar el producto
  let filename: string | null = null;
  if (file) {
    try {
      // Procesar y guardar imagen usando el servicio existente
      filename = await this.imageProcessingService.processAndSaveImage(
        file,
        productoGuardado.idProducto,
      );

      // Actualizar producto con la URL de la imagen
      await this.productoRepository.update(productoGuardado.idProducto, {
        foto: filename,
        usuarioModificacion: 'ADMIN', // Cambia según tu lógica de usuarios
        fechaModificacion: new Date(),
      });

      productoGuardado.foto = filename;
    } catch (error) {
      // Si falla el procesamiento de imagen, aún así retornamos el producto creado
      console.error('Error al procesar imagen:', error);
    }
  }

  return {
    message: 'Producto creado exitosamente',
    producto: {
      id: productoGuardado.idProducto,
      codigoMercaderia: productoGuardado.codigoMercaderia,
      nombre: productoGuardado.nombreProducto,
      precio: productoGuardado.precioUnitario,
      foto: filename,
      fotoUrl: filename ? `/catalog/images/${filename}` : null,
    },
  };
}


async updateProduct(
  id: number,
  updateProductDto: UpdateProductDto,
  file?: Express.Multer.File,
): Promise<void> {
  // 1. Verificar que el producto existe
  const producto = await this.productoRepository.findOne({
    where: { idProducto: id },
  });

  if (!producto) {
    throw new NotFoundException('Producto no encontrado');
  }

  // 2. Si se envía una nueva familia, buscar/crear subfamilia "NO ESPECIFICADO"
  let idSubFamiliaProducto = producto.idSubFamiliaProducto; // Mantener el actual por defecto

  if (updateProductDto.FamiliaProducto) {
    const familia = await this.familiaProductoRepository.findOne({
      where: { idFamiliaProducto: updateProductDto.FamiliaProducto },
    });

    if (!familia) {
      throw new NotFoundException('Familia de producto no encontrada');
    }

    // Buscar o crear subfamilia "NO ESPECIFICADO" para esta familia
    let subFamilia = await this.subFamiliaProductoRepository.findOne({
      where: {
        idFamiliaProducto: familia.idFamiliaProducto,
        nombreSubFamiliaProducto: 'NO ESPECIFICADO',
      },
    });

    if (!subFamilia) {
      subFamilia = this.subFamiliaProductoRepository.create({
        nombreSubFamiliaProducto: 'NO ESPECIFICADO',
        idFamiliaProducto: familia.idFamiliaProducto,
        noEspecificado: 'S',
        indicadorEstado: 'A',
        usuarioRegistro: 'ADMIN',
      });
      await this.subFamiliaProductoRepository.save(subFamilia);
    }

    idSubFamiliaProducto = subFamilia.idSubFamiliaProducto;
  }

  // 3. Manejar la actualización de imagen si se envió una nueva
  let newFilename = producto.foto; // Mantener la imagen actual por defecto

  if (file) {
    try {
      // Si ya tiene una imagen anterior, eliminarla
      if (producto.foto) {
        await this.imageProcessingService.deleteImage(producto.foto);
      }

      // Procesar y guardar la nueva imagen
      newFilename = await this.imageProcessingService.processAndSaveImage(
        file,
        id,
      );
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      throw new BadRequestException('Error al procesar la imagen');
    }
  }

  // 4. Actualizar el producto
  await this.productoRepository.update(id, {
    nombreProducto: updateProductDto.nombre || producto.nombreProducto,
    precioUnitario: updateProductDto.precio || producto.precioUnitario,
    foto: newFilename,
    idSubFamiliaProducto: idSubFamiliaProducto,
    usuarioModificacion: 'ADMIN', // O el usuario actual
    fechaModificacion: new Date(),
  });
}

  /**
   * Obtener productos por categoría (familia) con paginación
   * @param idFamiliaProducto - ID de la familia (opcional)
   * @param page - Número de página (default: 1)
   * @param limit - Cantidad de items por página (default: 10)
   */
  async getProductsByCategory(
    idFamiliaProducto?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponse> {
    // Construir el query base
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

    // Ordenar por ID descendente (los más nuevos primero)
    queryBuilder.orderBy('producto.idProducto', 'DESC');

    // Obtener el total de registros (antes de paginar)
    const total = await queryBuilder.getCount();

    // Calcular offset
    const offset = (page - 1) * limit;

    // Aplicar paginación
    queryBuilder.skip(offset).take(limit);

    // Ejecutar query
    const productos = await queryBuilder.getMany();

    // Mapear a la interfaz de respuesta
    const data: ProductListItem[] = productos.map((producto) => ({
      idProducto: producto.idProducto,
      nombre: producto.nombreProducto,
      familiaProducto:
        producto.subFamiliaProducto?.familiaProducto?.nombreFamiliaProducto ||
        'Sin categoría',
      precio: producto.precioUnitario || 0,
      foto: producto.foto || null,
      // Agregar URLs de las imágenes
      fotoUrl: producto.foto ? `/catalog/images/${producto.foto}` : null,
      fotoThumbnail: producto.foto ? `/catalog/images/${producto.foto}?size=thumbnails` : null,
      fotoMedium: producto.foto ? `/catalog/images/${producto.foto}?size=medium` : null,
      fotoOriginal: producto.foto ? `/catalog/images/${producto.foto}?size=original` : null,
    }));

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };

    return {
      data,
      meta,
    };
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