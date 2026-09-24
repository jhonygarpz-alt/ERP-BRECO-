import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Genera un QR (data URL) a partir de un texto -- usado en los formatos de impresion para el QR del folio fiscal del CFDI. */
export function useQrDataUrl(texto: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!texto) {
      setDataUrl(null);
      return;
    }
    let cancelado = false;
    QRCode.toDataURL(texto, { margin: 0, width: 160 })
      .then((url) => {
        if (!cancelado) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelado) setDataUrl(null);
      });
    return () => {
      cancelado = true;
    };
  }, [texto]);

  return dataUrl;
}
