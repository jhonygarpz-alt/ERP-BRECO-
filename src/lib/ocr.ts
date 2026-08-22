import { createWorker } from 'tesseract.js';

/**
 * Corre OCR sobre una imagen directamente en el navegador (tesseract.js).
 * Es un modelo generico de texto, no esta entrenado para tablas con
 * celdas de color / combinadas, asi que el resultado siempre se debe
 * tratar como un borrador que la persona revisa antes de guardar nada.
 */
export async function reconocerImagen(
  file: File,
  onProgress?: (fraccion: number) => void,
): Promise<string> {
  const worker = await createWorker('spa', 1, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/tesseract-core-simd-lstm.js',
    langPath: '/tesseract/lang',
    workerBlobURL: false,
    gzip: true,
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.progress);
      }
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}
