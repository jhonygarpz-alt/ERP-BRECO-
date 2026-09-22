import * as XLSX from 'xlsx';

// Genera y descarga un .xlsx a partir de filas ya calculadas (mismos datos
// que se ven en pantalla), para cualquier reporte de Trafico.
export function exportarExcel(nombreArchivo: string, headers: string[], rows: (string | number)[][]) {
  const hoja = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte');
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}
