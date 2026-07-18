import { Client, Equipment, ServiceOrder } from '../types';
import { addFooter, addSection, createPdf, downloadPdf } from './pdfDocument';

export async function printServiceNote(order: ServiceOrder, client?: Client, equipment?: Equipment) {
  const { pdf, y: startY } = await createPdf('NOTA DE SERVIÇO', order.id.toUpperCase());
  let y = addSection(pdf, startY, 'Cliente', `${client?.name ?? 'Não identificado'}\nTelefone: ${client?.phone ?? '-'}\nCidade: ${client?.city ?? '-'}`);
  y = addSection(pdf, y, 'Equipamento', `${equipment ? `${equipment.brand} ${equipment.model}` : 'Não identificado'}\nSérie/IMEI: ${equipment?.serial ?? '-'}`);
  y = addSection(pdf, y, 'Defeito relatado', order.problem);
  y = addSection(pdf, y, 'Diagnóstico técnico', order.diagnosis || '-');
  y = addSection(pdf, y, 'Serviços executados', order.servicePerformed || 'Aguardando registro dos serviços executados.');
  y = addSection(pdf, y, 'Garantia', order.warranty || '-');
  y = addSection(pdf, y, 'Observações técnicas', order.technicianNotes || '-');
  y = addSection(pdf, y, 'Conclusão', `Status: ${order.status}\nEntrada: ${order.intakeDate}\nSaída: ${order.exitDate || '-'}`);
  addSection(pdf, y, 'Assinaturas', '\n\nResponsável técnico: ______________________________\n\nCliente: _________________________________________');
  addFooter(pdf, `Nota de Serviço ${order.id.toUpperCase()}`);
  downloadPdf(pdf, `nota-de-servico-${order.id.toLowerCase()}.pdf`);
}
