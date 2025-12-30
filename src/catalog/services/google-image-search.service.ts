import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface GoogleImageSearchResult {
  items?: Array<{
    link: string;
    image: {
      thumbnailLink: string;
      contextLink: string;
    };
    title: string;
    displayLink: string;
  }>;
}

@Injectable()
export class GoogleImageSearchService {
  private readonly apiKey: string;
  private readonly searchEngineId: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_API_KEY')!;
    this.searchEngineId = this.configService.get<string>(
      'GOOGLE_SEARCH_ENGINE_ID',
    )!;

    if (!this.apiKey || !this.searchEngineId) {
      console.warn(
        'Google Image Search no configurado. Configura GOOGLE_API_KEY y GOOGLE_SEARCH_ENGINE_ID en .env',
      );
    }
  }

  /**
   * Buscar imágenes en Google
   * @param searchTerm - Término de búsqueda
   * @param numResults - Número de resultados (default: 5, max: 10)
   */
  async searchImages(
    searchTerm: string,
    numResults: number = 5,
  ): Promise<string[]> {
    if (!this.apiKey || !this.searchEngineId) {
      throw new BadRequestException(
        'Búsqueda de imágenes no configurada. Contacta al administrador.',
      );
    }

    if (!searchTerm || searchTerm.trim() === '') {
      throw new BadRequestException('El término de búsqueda no puede estar vacío');
    }

    // Limitar resultados entre 1 y 10
    const num = Math.min(Math.max(numResults, 1), 10);

    try {
      const url = 'https://www.googleapis.com/customsearch/v1';
      const params = {
        key: this.apiKey,
        cx: this.searchEngineId,
        q: searchTerm,
        searchType: 'image',
        num: num,
        safe: 'active', // Filtro de seguridad
        imgSize: 'large', // Preferir imágenes grandes
      };

      const response = await axios.get<GoogleImageSearchResult>(url, {
        params,
        timeout: 10000, // 10 segundos timeout
      });

      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }

      // Retornar las URLs de las imágenes
      return response.data.items.map((item) => item.link);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new BadRequestException(
            'Límite de búsquedas alcanzado. Intenta más tarde.',
          );
        }
        if (error.response?.status === 403) {
          throw new BadRequestException(
            'API Key inválida o sin permisos. Verifica la configuración.',
          );
        }
      }
      
      console.error('Error en búsqueda de imágenes:', error);
      throw new BadRequestException(
        'Error al buscar imágenes. Intenta de nuevo.',
      );
    }
  }

  /**
   * Descargar imagen desde URL
   * @param imageUrl - URL de la imagen
   * @returns Buffer de la imagen
   */
  async downloadImage(imageUrl: string): Promise<Buffer> {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw new BadRequestException('URL de imagen inválida');
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000, // 15 segundos
        maxContentLength: 10 * 1024 * 1024, // Máximo 10MB
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      // Validar que sea una imagen
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        throw new BadRequestException('La URL no contiene una imagen válida');
      }

      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new BadRequestException('Tiempo de descarga agotado');
        }
        if (error.response?.status === 404) {
          throw new BadRequestException('Imagen no encontrada');
        }
      }
      
      console.error('Error al descargar imagen:', error);
      throw new BadRequestException('Error al descargar la imagen');
    }
  }

  /**
   * Buscar y obtener la primera imagen
   * @param searchTerm - Término de búsqueda
   * @returns URL de la primera imagen encontrada
   */
  async getFirstImage(searchTerm: string): Promise<string | null> {
    const images = await this.searchImages(searchTerm, 1);
    return images.length > 0 ? images[0] : null;
  }
}