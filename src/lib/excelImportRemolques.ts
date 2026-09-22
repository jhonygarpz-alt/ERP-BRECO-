import { cajaToRow } from './mappers';
import { uid } from './storage';
import { booleano, descargarPlantilla, guardarEnLotes, leerFilasHoja, numero, texto, type FilaImport } from './excelImportShared';
import type { Caja } from '../types';

const COLUMNAS: { clave: string; campo: string }[] = [
  { clave: 'codigo', campo: 'economico' },
  { clave: 'placas', campo: 'placas' },
  { clave: 'tipo de remolque (clave sat)', campo: 'tipo' },
  { clave: 'capacidad (descripcion)', campo: 'capacidad' },
  { clave: 'marca', campo: 'marca' },
  { clave: 'modelo', campo: 'modelo' },
  { clave: 'anio', campo: 'anio' },
  { clave: 'activa', campo: 'activa' },
  { clave: 'rentada', campo: 'rentada' },
  { clave: 'es permisionario', campo: 'esPermisionario' },
  { clave: 'descripcion', campo: 'descripcion' },
  { clave: 'sucursal', campo: 'sucursal' },
  { clave: 'identidad satelital', campo: 'identidadSatelital' },
  { clave: 'identificador de convoy', campo: 'identificadorConvoy' },
  { clave: 'numero de serie', campo: 'numeroSerie' },
  { clave: 'color', campo: 'color' },
  { clave: 'grupo de unidades', campo: 'grupoUnidades' },
  { clave: 'largo (m)', campo: 'largoMetros' },
  { clave: 'ancho (m)', campo: 'anchoMetros' },
  { clave: 'alto (m)', campo: 'altoMetros' },
  { clave: 'capacidad (kg)', campo: 'capacidadKg' },
  { clave: 'numero de ejes', campo: 'numeroEjes' },
  { clave: 'peso tara (ton)', campo: 'pesoTaraTon' },
];

const ENCABEZADOS = [
  'Codigo', 'Placas', 'Tipo de Remolque (clave SAT)', 'Capacidad (descripcion)', 'Marca', 'Modelo', 'Anio', 'Activa',
  'Rentada', 'Es Permisionario', 'Descripcion', 'Sucursal', 'Identidad Satelital', 'Identificador de Convoy',
  'Numero de Serie', 'Color', 'Grupo de Unidades', 'Largo (m)', 'Ancho (m)', 'Alto (m)', 'Capacidad (Kg)',
  'Numero de Ejes', 'Peso Tara (Ton)',
];

export function descargarPlantillaRemolques(): void {
  descargarPlantilla({
    nombreArchivo: 'Plantilla_Importar_Remolques.xlsx',
    nombreHojaDatos: 'Remolques',
    encabezados: ENCABEZADOS,
    tituloInstrucciones: 'Instrucciones para llenar la plantilla de Remolques',
    notasGenerales: [
      '1. No cambies el nombre ni el orden de las columnas de la hoja "Remolques".',
      '2. Llena una fila por cada remolque, empezando en la fila 2.',
      '3. Guarda el archivo en formato .xlsx antes de subirlo.',
      '4. El Codigo (economico) no se puede repetir.',
      '5. Foto, documentos con vencimiento, archivos adicionales y seguros se agregan despues, editando cada remolque ya importado.',
    ],
    instrucciones: [
      ['Codigo', 'Obligatorio. El numero economico del remolque; no se puede repetir.'],
      ['Placas', 'Opcional.'],
      ['Tipo de Remolque (clave SAT)', 'Opcional. Usa la clave del catalogo SAT "c_SubTipoRem" (visible al editar un remolque en el sistema); ej. "CTR001".'],
      ['Capacidad (descripcion)', 'Opcional. Texto libre, ej. "53 pies".'],
      ['Marca', 'Opcional.'],
      ['Modelo', 'Opcional.'],
      ['Anio', 'Opcional. Numero (ej. 2022).'],
      ['Activa', 'Si o No. Si se deja en blanco se considera Si (activa).'],
      ['Rentada', 'Si o No.'],
      ['Es Permisionario', 'Si o No.'],
      ['Descripcion', 'Opcional.'],
      ['Sucursal', 'Opcional. Si se deja en blanco se usa "Matriz".'],
      ['Identidad Satelital', 'Opcional.'],
      ['Identificador de Convoy', 'Opcional.'],
      ['Numero de Serie', 'Opcional.'],
      ['Color', 'Opcional.'],
      ['Grupo de Unidades', 'Opcional. Debe coincidir con una fila del catalogo "Grupos de Unidades" (ej. General, Tractos, Remolques, Dolly).'],
      ['Largo (m)', 'Numero. Si se deja en blanco se usa 0.'],
      ['Ancho (m)', 'Numero. Si se deja en blanco se usa 0.'],
      ['Alto (m)', 'Numero. Si se deja en blanco se usa 0.'],
      ['Capacidad (Kg)', 'Numero. Si se deja en blanco se usa 0.'],
      ['Numero de Ejes', 'Numero. Si se deja en blanco se usa 0.'],
      ['Peso Tara (Ton)', 'Numero. Si se deja en blanco se usa 0.'],
    ],
  });
}

export async function leerRemolquesExcel(file: File): Promise<{ totalFilasHoja: number; filas: FilaImport<Caja>[] }> {
  const { encabezados, filas2d } = await leerFilasHoja(file, 'Remolques');
  const indices = new Map<string, number>();
  for (const { clave, campo } of COLUMNAS) indices.set(campo, encabezados.indexOf(clave));

  if ((indices.get('economico') ?? -1) === -1) {
    throw new Error('No se encontro la columna "Codigo". Usa la plantilla descargable sin modificar los encabezados.');
  }

  const col = (campo: string, fila: unknown[]) => {
    const i = indices.get(campo) ?? -1;
    return i === -1 ? null : fila[i];
  };

  const filas: FilaImport<Caja>[] = [];
  for (let i = 1; i < filas2d.length; i++) {
    const fila = filas2d[i];
    if (fila.every((v) => v === null || v === undefined || String(v).trim() === '')) continue;

    const economico = texto(col('economico', fila));
    const errores: string[] = [];
    if (!economico) errores.push('Falta el Codigo.');

    const item: Caja = {
      id: uid('caj'),
      economico,
      placas: texto(col('placas', fila)),
      tipo: texto(col('tipo', fila)),
      capacidad: texto(col('capacidad', fila)),
      estatus: 'Disponible',
      marca: texto(col('marca', fila)),
      modelo: texto(col('modelo', fila)),
      anio: numero(col('anio', fila)) || undefined,
      activa: col('activa', fila) === null ? true : booleano(col('activa', fila)),
      rentada: booleano(col('rentada', fila)),
      esPermisionario: booleano(col('esPermisionario', fila)),
      descripcion: texto(col('descripcion', fila)),
      sucursal: texto(col('sucursal', fila)) || 'Matriz',
      identidadSatelital: texto(col('identidadSatelital', fila)),
      identificadorConvoy: texto(col('identificadorConvoy', fila)),
      numeroSerie: texto(col('numeroSerie', fila)),
      color: texto(col('color', fila)),
      grupoUnidades: texto(col('grupoUnidades', fila)),
      fotoDataUrl: '',
      largoMetros: numero(col('largoMetros', fila)),
      anchoMetros: numero(col('anchoMetros', fila)),
      altoMetros: numero(col('altoMetros', fila)),
      capacidadKg: numero(col('capacidadKg', fila)),
      numeroEjes: numero(col('numeroEjes', fila)),
      pesoTaraTon: numero(col('pesoTaraTon', fila)),
      documentosVencimiento: [],
      archivosAdicionales: [],
      aseguradora: '',
      noPoliza: '',
      vigenciaDesde: '',
      vigenciaHasta: '',
      propietario: '',
      ubicacion: '',
      estadoCarga: 'Vacio',
    };

    filas.push({ fila: i + 1, item, errores });
  }

  return { totalFilasHoja: filas2d.length - 1, filas };
}

export function marcarDuplicadosRemolques(filas: FilaImport<Caja>[], existentes: Caja[]): FilaImport<Caja>[] {
  const vistos = new Set<string>();
  return filas.map((f) => {
    const errores = [...f.errores];
    const economico = f.item.economico.trim();
    if (economico) {
      if (existentes.some((c) => c.economico.trim() === economico)) errores.push(`El codigo "${economico}" ya existe.`);
      else if (vistos.has(economico)) errores.push(`El codigo "${economico}" esta repetido en el archivo.`);
      else vistos.add(economico);
    }
    return errores.length === f.errores.length ? f : { ...f, errores };
  });
}

export async function guardarRemolquesImportados(items: Caja[], onProgreso?: (hecho: number, total: number) => void): Promise<void> {
  await guardarEnLotes('cajas', items, cajaToRow, onProgreso);
}
