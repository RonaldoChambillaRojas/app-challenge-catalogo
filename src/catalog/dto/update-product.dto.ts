import { IsOptional } from "class-validator";

export class UpdateProductDto {
    @IsOptional()
    nombre?: string;
    @IsOptional()
    FamiliaProducto?: number;
    @IsOptional()
    precio?: number;
    @IsOptional()
    foto?: string;
}