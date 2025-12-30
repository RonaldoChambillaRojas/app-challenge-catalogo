// Interfaz para el listado de productos
export interface ProductListItem {
  idProducto: number;
  nombre: string;
  familiaProducto: string;
  precio: number;
  foto: string | null;
  fotoUrl?: string | null;
  fotoThumbnail?: string | null;
  fotoMedium?: string | null;
  fotoOriginal?: string | null;
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

// Interfaz para metadata de paginación
export interface PaginationMeta {
  page: number; // Página actual
  limit: number; // Cantidad de items por página
  total: number; // Total de items
  totalPages: number; // Total de páginas
  hasNextPage: boolean; // ¿Hay página siguiente?
  hasPreviousPage: boolean; // ¿Hay página anterior?
}

// Interfaz para respuesta paginada de productos
export interface PaginatedProductsResponse {
  data: ProductListItem[]; // Los productos
  meta: PaginationMeta; // Metadata de paginación
}

// Interfaz para resultado de búsqueda de imágenes
export interface ImageSearchResult {
  images: string[]; // URLs de las imágenes encontradas
  count: number; // Cantidad de imágenes
  searchTerm: string; // Término buscado
}

// Interfaz para resultado de descarga de imagen
export interface ImageDownloadResult {
  message: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  originalUrl: string;
}