import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
    @IsString()
    codigoMercaderia: string;

    @IsString()
    nombre: string;

    @IsNumber()
    FamiliaProducto: number;

    @IsNumber()
    precio: number;

    @IsString()
    @IsOptional()
    foto: string;
}