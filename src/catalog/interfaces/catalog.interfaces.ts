// Interfaz para el listado de productos
export interface ProductListItem {
  idProducto: number;
  nombre: string;
  familiaProducto: string;
  precio: number;
  foto: string | null;
}

// Interfaz para el listado de familias
export interface FamilyProducts {
  idFamiliaProducto: number;
  nombreFamilia: string;
}

// Interfaz para el código generado
export interface GeneratedCode {
  codigo: string;
}