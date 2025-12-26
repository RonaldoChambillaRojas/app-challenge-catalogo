import { IsOptional, IsNumberString } from 'class-validator';

export class GetProductsByCategoryDto {
  @IsOptional()
  @IsNumberString()
  idFamiliaProducto?: string;
}