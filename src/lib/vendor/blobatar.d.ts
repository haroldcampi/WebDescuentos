export interface OpcionesBlobatar {
  background?: false | string;
  traits?: { shape?: number };
  expression?: unknown;
  hue?: number;
}
export function blobatar(semilla: string, opciones?: OpcionesBlobatar): string;
export const layout: unknown;
