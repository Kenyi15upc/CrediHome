export interface EntidadFinanciera {
  id: number;
  nombre: string;
  codigo: string;
  activa: boolean;
  tasaMinima?: number;
  tasaMaxima?: number;
  montoMinimo?: number;
  montoMaximo?: number;
  plazoMinimo?: number;
  plazoMaximo?: number;
  aceptaBonoTechoPropio: boolean;
  graciaTotalMaxima: number;
  graciaParcialMaxima: number;
}
