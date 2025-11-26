import { Asesor } from "./asesor";

export interface UnidadInmobiliaria {
  idUnidad: number;
  nombre: string;
  direccion: string;
  precio: number;
  moneda: string;
  estadoU: boolean;
  fechaRegistro: string;
  asesor?: Asesor;
}
