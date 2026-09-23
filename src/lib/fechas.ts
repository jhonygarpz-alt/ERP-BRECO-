/**
 * `new Date().toISOString().slice(0, 10)` (usado por todo el sistema para
 * obtener "la fecha de hoy") calcula la fecha en UTC, no en la zona horaria
 * del usuario: cerca de medianoche en Mexico (UTC-6) el reloj local todavia
 * marca un dia, pero UTC ya paso al siguiente, asi que ese calculo mostraba
 * "manana" como si fuera hoy. `toLocaleDateString('en-CA')` da el mismo
 * formato YYYY-MM-DD pero calculado con la fecha local del navegador.
 */
export function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA');
}

/** Igual que hoyISO() pero para convertir cualquier Date ya construido
 * (ej. una fecha desplazada n dias) a "YYYY-MM-DD" en la zona horaria local
 * en vez de UTC. */
export function fechaLocal(d: Date): string {
  return d.toLocaleDateString('en-CA');
}
