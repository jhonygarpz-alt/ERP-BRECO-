import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import type { Cliente, Empresa, Factura, Viaje } from '../types';
import { calcularTotalesFactura } from './facturacion';

function money(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function nombreArchivoFactura(f: Factura): string {
  return `Factura-${f.folio}.pdf`;
}

/** Genera el PDF de una factura (mismo contenido que la pantalla de impresion) para descargarlo o meterlo a un zip. */
export function crearFacturaPdf(factura: Factura, cliente: Cliente | undefined, viajesIncluidos: Viaje[], empresa: Empresa): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margenX = 40;
  let y = 40;

  if (empresa.logoDataUrl) {
    try {
      const formato = /data:image\/(\w+);/.exec(empresa.logoDataUrl)?.[1]?.toUpperCase() ?? 'PNG';
      doc.addImage(empresa.logoDataUrl, formato === 'JPG' ? 'JPEG' : formato, margenX, y, 60, 40, undefined, 'FAST');
    } catch {
      // Si el logo no es un formato que jsPDF pueda decodificar, se omite sin romper el PDF.
    }
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(empresa.razonSocial || empresa.nombre || 'Sistema de Trafico', margenX + 70, y + 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (empresa.rfc) doc.text(`RFC: ${empresa.rfc}`, margenX + 70, y + 28);
  if (empresa.direccion) doc.text(empresa.direccion, margenX + 70, y + 40);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Factura ${factura.folio}`, 572, y + 14, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${factura.fecha}`, 572, y + 28, { align: 'right' });
  doc.text(`Estatus: ${factura.estatus}`, 572, y + 40, { align: 'right' });

  y += 65;
  doc.setDrawColor(17);
  doc.line(margenX, y, 572, y);
  y += 20;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margenX, y);
  doc.text('CONDICIONES', 320, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente?.nombre ?? '—', margenX, y + 14);
  doc.text(cliente?.rfc ?? '', margenX, y + 26);
  doc.text(`${factura.condicionesPago} - ${factura.metodoPago} - Uso CFDI ${factura.usoCfdi}`, 320, y + 14);
  doc.text(`Moneda: ${factura.moneda === 'MXN' ? 'PESOS' : 'DOLARES'}`, 320, y + 26);

  y += 40;
  if (viajesIncluidos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('VIAJES INCLUIDOS', margenX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(viajesIncluidos.map((v) => v.folio).join(', '), margenX, y + 14);
    y += 30;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margenX, right: 40 },
    head: [['Cantidad', 'Concepto', 'Precio Unitario', 'Importe', 'IVA']],
    body: factura.lineas.map((l) => [String(l.cantidad), l.concepto, money(l.precioUnitario), money(l.importe), money(l.importeIva)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [17, 17, 17] },
  });

  const totales = calcularTotalesFactura(factura.lineas);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable?.finalY ?? y + 40;
  finalY += 20;

  const filas: [string, string][] = [
    ['Subtotal', money(totales.subtotal)],
    ['Descuento', money(totales.descuentoTotal)],
    ['IVA', money(totales.totalIva)],
    ['Retenciones', `-${money(totales.totalRetenciones)}`],
  ];
  doc.setFontSize(9);
  filas.forEach(([label, valor], i) => {
    doc.text(label, 420, finalY + i * 14);
    doc.text(valor, 572, finalY + i * 14, { align: 'right' });
  });
  const totalY = finalY + filas.length * 14 + 6;
  doc.setDrawColor(17);
  doc.line(420, totalY - 10, 572, totalY - 10);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 420, totalY + 4);
  doc.text(money(totales.total), 572, totalY + 4, { align: 'right' });

  if (factura.observaciones) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVACIONES', margenX, totalY + 30);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(factura.observaciones, 500), margenX, totalY + 44);
  }

  return doc;
}

export function descargarFacturaPdf(factura: Factura, cliente: Cliente | undefined, viajesIncluidos: Viaje[], empresa: Empresa) {
  crearFacturaPdf(factura, cliente, viajesIncluidos, empresa).save(nombreArchivoFactura(factura));
}

/** Genera un PDF por cada factura y las junta en un solo .zip para descarga masiva. */
export async function descargarFacturasZip(
  facturasSeleccionadas: Factura[],
  clientes: Cliente[],
  viajes: Viaje[],
  empresa: Empresa,
  nombreZip: string,
) {
  const zip = new JSZip();
  for (const f of facturasSeleccionadas) {
    const cliente = clientes.find((c) => c.id === f.clienteId);
    const viajesIncluidos = f.viajeIds.map((vid) => viajes.find((v) => v.id === vid)).filter((v): v is Viaje => Boolean(v));
    const doc = crearFacturaPdf(f, cliente, viajesIncluidos, empresa);
    zip.file(nombreArchivoFactura(f), doc.output('blob'));
  }
  const contenido = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(contenido);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreZip;
  a.click();
  URL.revokeObjectURL(url);
}
