import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/** Extrae todo el texto de un PDF (concatenando cada pagina), para parsearlo despues. */
export async function extraerTextoPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const paginas: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const pagina = await pdf.getPage(i);
    const contenido = await pagina.getTextContent();
    // Reconstruye lineas usando "hasEOL" de cada item (mas fiel que unir todo
    // con espacios, que mezclaria columnas de una misma fila de tabla).
    let texto = '';
    for (const it of contenido.items) {
      if (!('str' in it)) continue;
      texto += it.str;
      texto += it.hasEOL ? '\n' : ' ';
    }
    paginas.push(texto);
  }
  return paginas.join('\n');
}
