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
  descuento: number;
  ahorro: number;
  imagenes: string[];
  _texto: string;
}

export type Orden = "relevancia" | "tendencias" | "recientes" | "popularidad" | "descuento" | "ahorro" | "precio-asc" | "precio-desc" | "valoracion";
export type Grupo = "ninguno" | "tipo" | "categoria" | "tienda" | "marca";

export interface Filtros {
  q: string;
  categoria: string;
  tiendas: string[];
  orden: Orden;
  grupo: Grupo;
  favoritos: boolean;
  min: number;
  max: number;
}

export interface ConfigAvatar {
  forma: string;
  expresion: string;
  fondo: string;
  tono: number | "auto";
}
