import { Type } from 'class-transformer';
import { IsOptional, IsNumberString, Min } from 'class-validator';

export class GetProductsByCategoryDto {
  @IsOptional()
  @IsNumberString()
  idFamiliaProducto?: string;

  // Paginación
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10; // Valor por defecto: 10 productos por página
}