import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
    @IsString()
    codigoMercaderia: string;

    @IsString()
    nombre: string;

    @IsNumber()
    @Type(() => Number) 
    FamiliaProducto: number;

    @IsNumber()
    @Type(() => Number)
    precio: number;


    @IsOptional()
    @IsString()
    googleImageUrl?: string; // Nueva propiedad opcional

    // @IsString()
    // @IsOptional()
    // foto: string;
}