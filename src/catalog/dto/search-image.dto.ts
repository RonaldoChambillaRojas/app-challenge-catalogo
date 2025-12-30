import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchImageDto {
  @IsString()
  @IsNotEmpty()
  term: string; // Término de búsqueda (ej: "Laptop HP Pavilion")

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  numResults?: number = 5; // Número de resultados (default: 5)
}

export class DownloadImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string; // URL de la imagen a descargar

  @IsNumber()
  @Type(() => Number)
  productId: number; // ID del producto al que se asociará
}