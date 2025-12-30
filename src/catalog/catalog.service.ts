import { 
  Injectable ,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { FamiliaProducto } from './entities/familia-producto.entity';
import { SubFamiliaProducto } from './entities';
import type {
  ProductListItem,
  FamilyProducts,
  GeneratedCode,
  PaginatedProductsResponse,
  PaginationMeta,
  ImageSearchResult,
  ImageDownloadResult,
} from './interfaces/catalog.interfaces';
import { ImageProcessingService } from './services/image-processing.service';
import { GoogleImageSearchService } from './services/google-image-search.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(FamiliaProducto)
    private readonly familiaProductoRepository: Repository<FamiliaProducto>,
    @InjectRepository(SubFamiliaProducto)
    private readonly subFamiliaProductoRepository: Repository<SubFamiliaProducto>,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly googleImageSearchService: GoogleImageSearchService,
  ) {}

  // ========== MÉTODOS DE BÚSQUEDA DE IMÁGENES ==========

  /**
   * Buscar imágenes en Google para un producto
   * @param searchTerm - Término de búsqueda
   * @param numResults - Número de resultados
   */
  async searchImagesForProduct(
    searchTerm: string,
    numResults: number = 5,
  ): Promise<ImageSearchResult> {
    const images = await this.googleImageSearchService.searchImages(
      searchTerm,
      numResults,
    );

    return {
      images,
      count: images.length,
      searchTerm,
    };
  }

  /**
   * Descargar imagen desde URL y asociarla a un producto
   * @param imageUrl - URL de la imagen
   * @param productId - ID del producto
   */
  async downloadImageForProduct(
    imageUrl: string,
    productId: number,
  ): Promise<ImageDownloadResult> {
    // Verificar que el producto existe
    const producto = await this.productoRepository.findOne({
      where: { idProducto: productId },
    });

    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${productId} no encontrado`,
      );
    }

    // Descargar la imagen
    const imageBuffer = await this.googleImageSearchService.downloadImage(imageUrl);

    // Si el producto ya tiene una imagen, eliminarla
    if (producto.foto) {
      await this.imageProcessingService.deleteImage(producto.foto);
    }

    // Procesar y guardar la nueva imagen
    const filename = await this.imageProcessingService.processAndSaveImageFromBuffer(
      imageBuffer,
      productId,
    );

    // Actualizar producto en BD
    await this.productoRepository.update(productId, {
      foto: filename,
      usuarioModificacion: 'SYSTEM',
      fechaModificacion: new Date(),
    });

    return {
      message: 'Imagen descargada y guardada exitosamente',
      filename,
      url: `/catalog/images/${filename}`,
      thumbnailUrl: `/catalog/images/${filename}?size=thumbnails`,
      mediumUrl: `/catalog/images/${filename}?size=medium`,
      originalUrl: `/catalog/images/${filename}?size=original`,
    };
  }

  // ========== MÉTODOS EXISTENTES (sin cambios) ==========

  async createProduct(
    createProductDto: CreateProductDto,
    file?: Express.Multer.File,
  ): Promise<{ message: string; producto: any }> {
    const familia = await this.familiaProductoRepository.findOne({
      where: { idFamiliaProducto: createProductDto.FamiliaProducto },
    });

    if (!familia) {
      throw new NotFoundException('Familia de producto no encontrada');
    }

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

    const nuevoProducto = this.productoRepository.create({
      codigoMercaderia: createProductDto.codigoMercaderia,
      nombreProducto: createProductDto.nombre,
      precioUnitario: createProductDto.precio,
      idSubFamiliaProducto: subFamilia.idSubFamiliaProducto,
      foto: null,
    });

    const productoGuardado = await this.productoRepository.save(nuevoProducto);

    let filename: string | null = null;
    if (file) {
      try {
        filename = await this.imageProcessingService.processAndSaveImage(
          file,
          productoGuardado.idProducto,
        );

        await this.productoRepository.update(productoGuardado.idProducto, {
          foto: filename,
          usuarioModificacion: 'ADMIN',
          fechaModificacion: new Date(),
        });

        productoGuardado.foto = filename;
      } catch (error) {
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
    const producto = await this.productoRepository.findOne({
      where: { idProducto: id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    let idSubFamiliaProducto = producto.idSubFamiliaProducto;

    if (updateProductDto.FamiliaProducto) {
      const familia = await this.familiaProductoRepository.findOne({
        where: { idFamiliaProducto: updateProductDto.FamiliaProducto },
      });

      if (!familia) {
        throw new NotFoundException('Familia de producto no encontrada');
      }

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

    let newFilename = producto.foto;

    if (file) {
      try {
        if (producto.foto) {
          await this.imageProcessingService.deleteImage(producto.foto);
        }

        newFilename = await this.imageProcessingService.processAndSaveImage(
          file,
          id,
        );
      } catch (error) {
        console.error('Error al procesar imagen:', error);
        throw new BadRequestException('Error al procesar la imagen');
      }
    }

    await this.productoRepository.update(id, {
      nombreProducto: updateProductDto.nombre || producto.nombreProducto,
      precioUnitario: updateProductDto.precio || producto.precioUnitario,
      foto: newFilename,
      idSubFamiliaProducto: idSubFamiliaProducto,
      usuarioModificacion: 'ADMIN',
      fechaModificacion: new Date(),
    });
  }

  async getProductsByCategory(
    idFamiliaProducto?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponse> {
    const queryBuilder = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.subFamiliaProducto', 'subFamilia')
      .leftJoinAndSelect('subFamilia.familiaProducto', 'familia')
      .where('producto.estadoProducto = :estado', { estado: '1' })
      .andWhere('producto.indicadorEstado = :indicador', { indicador: 'A' });

    if (idFamiliaProducto) {
      queryBuilder.andWhere('familia.IdFamiliaProducto = :idFamilia', {
        idFamilia: idFamiliaProducto,
      });
    }

    queryBuilder.orderBy('producto.idProducto', 'DESC');

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const productos = await queryBuilder.getMany();

    const data: ProductListItem[] = productos.map((producto) => ({
      idProducto: producto.idProducto,
      nombre: producto.nombreProducto,
      familiaProducto:
        producto.subFamiliaProducto?.familiaProducto?.nombreFamiliaProducto ||
        'Sin categoría',
      precio: producto.precioUnitario || 0,
      foto: producto.foto || null,
      fotoUrl: producto.foto ? `/catalog/images/${producto.foto}` : null,
      fotoThumbnail: producto.foto ? `/catalog/images/${producto.foto}?size=thumbnails` : null,
      fotoMedium: producto.foto ? `/catalog/images/${producto.foto}?size=medium` : null,
      fotoOriginal: producto.foto ? `/catalog/images/${producto.foto}?size=original` : null,
    }));

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

  async searchProducts(
    term: string,
    page: number = 1,
    limit: number = 10,
    idFamiliaProducto?: number,
  ): Promise<PaginatedProductsResponse> {
    if (!term || term.trim() === '') {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const normalTerm = term.trim();
    const cleanTerm = normalTerm.replace(/\s+/g, '').toUpperCase();
    const words = normalTerm.split(/\s+/).filter((word) => word.length > 0);

    const queryBuilder = this.productoRepository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.subFamiliaProducto', 'subFamilia')
      .leftJoinAndSelect('subFamilia.familiaProducto', 'familia')
      .where('producto.estadoProducto = :estado', { estado: '1' })
      .andWhere('producto.indicadorEstado = :indicador', { indicador: 'A' });

    if (words.length > 1) {
      const conditions = words
        .map((_, index) => {
          return `(
            UPPER(producto.nombreProducto) LIKE UPPER(:word${index}) OR
            UPPER(REPLACE(producto.nombreProducto, ' ', '')) LIKE UPPER(:word${index})
          )`;
        })
        .join(' AND ');

      const params: any = {};
      words.forEach((word, index) => {
        params[`word${index}`] = `%${word}%`;
      });

      queryBuilder.andWhere(
        `(
          (${conditions}) OR
          producto.codigoMercaderia LIKE :normalTerm OR
          UPPER(familia.nombreFamiliaProducto) LIKE UPPER(:normalTerm)
        )`,
        { ...params, normalTerm: `%${normalTerm}%` },
      );
    } else {
      queryBuilder.andWhere(
        `(
          UPPER(producto.nombreProducto) LIKE UPPER(:normalTerm) OR
          UPPER(REPLACE(producto.nombreProducto, ' ', '')) LIKE :cleanTerm OR
          producto.codigoMercaderia LIKE :normalTerm OR
          UPPER(familia.nombreFamiliaProducto) LIKE UPPER(:normalTerm)
        )`,
        {
          normalTerm: `%${normalTerm}%`,
          cleanTerm: `%${cleanTerm}%`,
        },
      );
    }

    if (idFamiliaProducto) {
      queryBuilder.andWhere('familia.IdFamiliaProducto = :idFamilia', {
        idFamilia: idFamiliaProducto,
      });
    }

    const escapedTerm = normalTerm.replace(/'/g, "''");
    queryBuilder.addSelect(
      `CASE 
        WHEN UPPER(producto.nombreProducto) = UPPER('${escapedTerm}') THEN 1
        WHEN UPPER(producto.nombreProducto) LIKE UPPER('${escapedTerm}%') THEN 2
        ELSE 3
      END`,
      'relevance'
    );

    queryBuilder
      .orderBy('relevance', 'ASC')
      .addOrderBy('producto.idProducto', 'DESC');

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const productos = await queryBuilder.getMany();

    const data: ProductListItem[] = productos.map((producto) => ({
      idProducto: producto.idProducto,
      nombre: producto.nombreProducto,
      familiaProducto:
        producto.subFamiliaProducto?.familiaProducto?.nombreFamiliaProducto ||
        'Sin categoría',
      precio: producto.precioUnitario || 0,
      foto: producto.foto || null,
      fotoUrl: producto.foto ? `/catalog/images/${producto.foto}` : null,
      fotoThumbnail: producto.foto
        ? `/catalog/images/${producto.foto}?size=thumbnails`
        : null,
      fotoMedium: producto.foto
        ? `/catalog/images/${producto.foto}?size=medium`
        : null,
      fotoOriginal: producto.foto
        ? `/catalog/images/${producto.foto}?size=original`
        : null,
    }));

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

  async getFamilies(): Promise<FamilyProducts[]> {
    const familias = await this.familiaProductoRepository.find({
      where: {
        indicadorEstado: 'A',
        noEspecificado: 'N',
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

  async generateProductCode(): Promise<GeneratedCode> {
    let isUnique = false;
    let codigo = '';

    while (!isUnique) {
      const fecha = new Date();
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const random = Math.floor(10000 + Math.random() * 90000);

      codigo = `PROD-${year}${month}${day}-${random}`;

      const exists = await this.productoRepository.findOne({
        where: { codigoMercaderia: codigo },
      });

      if (!exists) {
        isUnique = true;
      }
    }

    return { codigo };
  }

  async uploadProductImage(
    productId: number,
    file: Express.Multer.File,
  ): Promise<{ message: string; filename: string; url: string }> {
    const producto = await this.productoRepository.findOne({
      where: { idProducto: productId },
    });

    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${productId} no encontrado`,
      );
    }

    if (producto.foto) {
      await this.imageProcessingService.deleteImage(producto.foto);
    }

    const filename = await this.imageProcessingService.processAndSaveImage(
      file,
      productId,
    );

    await this.productoRepository.update(productId, {
      foto: filename,
      usuarioModificacion: 'SYSTEM',
      fechaModificacion: new Date(),
    });

    return {
      message: 'Imagen subida exitosamente',
      filename,
      url: `/catalog/images/${filename}`,
    };
  }

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

    await this.imageProcessingService.deleteImage(producto.foto);

    await this.productoRepository.update(productId, {
      foto: null,
      usuarioModificacion: 'SYSTEM',
      fechaModificacion: new Date(),
    });

    return { message: 'Imagen eliminada exitosamente' };
  }
}