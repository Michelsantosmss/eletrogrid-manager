import { jsPDF } from 'jspdf';
import logoUrl from '../assets/eletrogrid-reference.jpg';

const navy = [8, 41, 93] as const;
const orange = [246, 139, 31] as const;

export async function createPdf(title: string, reference: string) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  pdf.setFillColor(...navy);
  pdf.rect(0, 0, 210, 42, 'F');
  try {
    const image = new Image();
    image.src = logoUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 400;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponível');
    context.drawImage(image, 105, 235, 500, 400, 0, 0, 500, 400);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 8, 6, 28, 22.4, undefined, 'FAST');
  } catch {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(19);
    pdf.setTextColor(255, 255, 255);
    pdf.text('EG', 12, 23);
  }
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('ELETRO', 39, 15);
  const eletroWidth = pdf.getTextWidth('ELETRO');
  pdf.setTextColor(...orange);
  pdf.text('GRID', 39 + eletroWidth, 15);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.7);
  pdf.text(['soluções em eletrônica,', 'energia solar e', 'serviços elétricos'], 39, 21);
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.7);
  pdf.line(82, 6, 82, 35);
  pdf.setTextColor(...orange);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(title.length > 18 ? 18 : 22);
  pdf.text(title, 90, 21);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text(reference.toUpperCase(), 90, 29);
  pdf.setFillColor(...orange);
  pdf.rect(0, 40, 116, 1.4, 'F');
  pdf.triangle(116, 40, 120, 41.4, 116, 41.4, 'F');
  return { pdf, y: 49 };
}

export function addSection(pdf: jsPDF, y: number, title: string, content: string) {
  const lines = pdf.splitTextToSize(content || '-', 174) as string[];
  const height = 13 + lines.length * 5;
  if (y + height > 278) { pdf.addPage(); y = 18; }
  pdf.setFillColor(237, 243, 251);
  pdf.setTextColor(...navy);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.rect(14, y, 182, 8, 'F');
  pdf.text(title.toUpperCase(), 17, y + 5.5);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(lines, 17, y + 13);
  return y + height + 4;
}

export function addFooter(pdf: jsPDF, label: string) {
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...navy);
    pdf.line(14, 286, 196, 286);
    pdf.setTextColor(90, 105, 128);
    pdf.setFontSize(8);
    pdf.text(`EletroGrid Manager - ${label}`, 14, 291);
    pdf.text(`Página ${page} de ${pages}`, 196, 291, { align: 'right' });
  }
}

export function downloadPdf(pdf: jsPDF, filename: string) {
  pdf.save(filename);
}
