import { Client, Equipment, ServiceOrder } from '../types';
import { addFooter, addSection, createPdf, downloadPdf } from './pdfDocument';

export async function printServiceOrder(order: ServiceOrder, client?: Client, equipment?: Equipment) {
  const { pdf, y: startY } = await createPdf('ORDEM DE SERVIÇO', order.id.toUpperCase());
  let y = addSection(pdf, startY, 'Cliente', `${client?.name ?? 'Não identificado'}\nCPF/CNPJ: ${client?.document ?? '-'}\nTelefone: ${client?.phone ?? '-'}\nE-mail: ${client?.email ?? '-'}\nCidade: ${client?.city ?? '-'}`);
  y = addSection(pdf, y, 'Equipamento', `${equipment ? `${equipment.brand} ${equipment.model}` : 'Não identificado'}\nCategoria: ${equipment?.category ?? '-'}\nSérie/IMEI: ${equipment?.serial ?? '-'}\nCor: ${equipment?.color ?? '-'}\nTensão: ${equipment?.voltage ?? '-'}\nAcessórios: ${equipment?.accessories ?? '-'}\nEstado na entrada: ${equipment?.condition ?? '-'}`);
  y = addSection(pdf, y, 'Defeito informado pelo cliente', order.problem);
  y = addSection(pdf, y, 'Diagnóstico técnico', order.diagnosis || 'Em análise técnica.');
  y = addSection(pdf, y, 'Situação da OS', `Status: ${order.status}\nEntrada: ${order.intakeDate}\nSaída: ${order.exitDate ?? '-'}`);
  addSection(pdf, y, 'Histórico', order.history.map((entry) => `${entry.at} - ${entry.status} - ${entry.note}`).join('\n') || '-');
  addFooter(pdf, `Ordem de Serviço ${order.id.toUpperCase()}`);
  downloadPdf(pdf, `ordem-de-servico-${order.id.toLowerCase()}.pdf`);
}
