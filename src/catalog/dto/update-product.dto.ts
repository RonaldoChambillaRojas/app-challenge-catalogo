import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateProductDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    FamiliaProducto?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    precio?: number;

}