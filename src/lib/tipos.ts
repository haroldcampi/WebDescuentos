/* Forma de cada producto del catálogo (src/data/productos.ts). Los campos opcionales se explican allí. */
export type Cupon = string | { codigo?: string; texto?: string };

export interface ProductoBase {
  id: string;
  titulo: string;
  tituloEn?: string;
  tienda: string;
  categoria: string;
  precio: number;
  precioAnterior?: number | null;
  valoracion?: number;
  resenas?: number;
  imagenes?: string[];
  enlace: string;
  actualizado?: string;
  marca?: string;
  tipo?: string;
  historial?: [string, number][];
  cupon?: Cupon;
  prime?: boolean;
  reclamado?: number;
  errorPrecio?: boolean;
  verificado?: boolean;
  publicado?: string;
  termina?: string;
}

// Producto listo para la web: con descuento, ahorro, texto de búsqueda y fotos (reales o provisionales)
export interface Producto extends ProductoBase {
  // Precio oculto (Amazon con precio de más de 24 h): sin precio, descuento, historial ni alerta
  sinPrecio: boolean;
  descuento: number;
  ahorro: number;
  imagenes: string[];
  _texto: string;
}

export type Orden = "destacadas" | "popularidad" | "descuento" | "precio-asc" | "min90";
// Qué muestra la portada: todas las ofertas, las guardadas (favoritos) o las alertas de precio
export type Vista = "catalogo" | "favoritos" | "alertas";

export interface Filtros {
  q: string;
  categoria: string;
  // Tienda elegida en la franja de filtros (vacío = todas)
  tiendas: string[];
  orden: Orden;
  // Solo ofertas en su precio más bajo de los últimos 90 días
  min90: boolean;
  // Rango de precio en dólares (0 = sin límite)
  min: number;
  max: number;
  vista: Vista;
}

export interface ConfigAvatar {
  forma: string;
  expresion: string;
  fondo: string;
  tono: number | "auto";
}
