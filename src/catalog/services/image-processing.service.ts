import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageProcessingService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'products');

  /**
   * Procesar y guardar imagen en múltiples tamaños
   * @param file - Archivo subido
   * @param productId - ID del producto
   * @returns nombre del archivo guardado
   */
  async processAndSaveImage(
    file: Express.Multer.File,
    productId: number,
  ): Promise<string> {
    // Validar que sea una imagen
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'La imagen es demasiado grande. Máximo 5MB',
      );
    }

    // Generar nombre único
    const timestamp = Date.now();
    const filename = `producto-${productId}-${timestamp}.webp`;

    try {
      // Procesar imagen original
      const imageBuffer = file.buffer;

      // 1. Thumbnail (200x200) - Para listados
      await sharp(imageBuffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toFile(path.join(this.uploadPath, 'thumbnails', filename));

      // 2. Medium (800x600) - Para vista de detalle
      await sharp(imageBuffer)
        .resize(800, 600, {
          fit: 'inside',
          withoutEnlargement: true, // No agrandar si es más pequeña
        })
        .webp({ quality: 85 })
        .toFile(path.join(this.uploadPath, 'medium', filename));

      // 3. Original optimizado - Para zoom o descarga
      const metadata = await sharp(imageBuffer).metadata();
      let resizeOptions = {};

      // Si la imagen es muy grande, reducirla pero mantener proporción
      if (metadata.width > 1920 || metadata.height > 1920) {
        resizeOptions = {
          width: 1920,
          height: 1920,
          fit: 'inside',
        };
      }

      await sharp(imageBuffer)
        .resize(resizeOptions)
        .webp({ quality: 90 })
        .toFile(path.join(this.uploadPath, 'original', filename));

      return filename;
    } catch (error) {
      throw new BadRequestException(
        `Error al procesar la imagen: ${error.message}`,
      );
    }
  }

  /**
   * Eliminar imagen de todas las carpetas
   * @param filename - Nombre del archivo
   */
  async deleteImage(filename: string): Promise<void> {
    if (!filename) return;

    const sizes = ['thumbnails', 'medium', 'original'];

    for (const size of sizes) {
      const filePath = path.join(this.uploadPath, size, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  /**
   * Obtener ruta completa de una imagen
   * @param filename - Nombre del archivo
   * @param size - Tamaño (thumbnail, medium, original)
   */
  getImagePath(
    filename: string,
    size: 'thumbnails' | 'medium' | 'original' = 'original',
  ): string {
    return path.join(this.uploadPath, size, filename);
  }

  /**
   * Verificar si existe una imagen
   */
  imageExists(
    filename: string,
    size: 'thumbnails' | 'medium' | 'original' = 'original',
  ): boolean {
    const filePath = this.getImagePath(filename, size);
    return fs.existsSync(filePath);
  }
}