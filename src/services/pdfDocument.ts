import { jsPDF } from 'jspdf';
import logoUrl from '../assets/eletrogrid-reference.jpg';

const navy = [8, 41, 93] as const;
const orange = [246, 139, 31] as const;

export async function createPdf(title: string, reference: string) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  try {
    const response = await fetch(logoUrl);
    const logo = new Uint8Array(await response.arrayBuffer());
    pdf.addImage(logo, 'JPEG', 14, 10, 38, 22, undefined, 'FAST');
  } catch {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(...navy);
    pdf.text('ELETROGRID', 14, 23);
  }
  pdf.setDrawColor(...orange);
  pdf.setLineWidth(1.5);
  pdf.line(14, 35, 196, 35);
  pdf.setTextColor(...navy);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.text(title, 196, 18, { align: 'right' });
  pdf.setFontSize(10);
  pdf.text(reference.toUpperCase(), 196, 26, { align: 'right' });
  return { pdf, y: 44 };
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
