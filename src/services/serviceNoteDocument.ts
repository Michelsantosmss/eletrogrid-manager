import { Client, Equipment, Quote, ServiceOrder } from '../types';
import { addFooter, addSection, createPdf, downloadPdf } from './pdfDocument';
import { quoteItems } from './quoteDocument';
import { documentFilename } from './documentFilename';

export async function printServiceNote(order: ServiceOrder, client?: Client, equipment?: Equipment, quote?: Quote) {
  if (!order.serviceValue || order.serviceValue <= 0) throw new Error('Informe o valor do serviço antes de gerar a nota.');
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const quotedMaterialValue = quote
    ? quoteItems(quote)
      .filter((item) => item.kind === 'Peça/material')
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    : 0;
  const materialValue = Math.min(quotedMaterialValue, order.serviceValue);
  const serviceValue = Math.max(0, order.serviceValue - materialValue);
  const { pdf, y: startY } = await createPdf('NOTA DE SERVIÇO', order.id.toUpperCase());
  let y = addSection(pdf, startY, 'Cliente', `${client?.name ?? 'Não identificado'}\nCPF/CNPJ: ${client?.document ?? '-'}\nTelefone: ${client?.phone ?? '-'}\nE-mail: ${client?.email ?? '-'}\nCidade: ${client?.city ?? '-'}`);
  y = addSection(pdf, y, 'Equipamento', `${equipment ? `${equipment.equipmentName ? `${equipment.equipmentName} - ` : ''}${equipment.brand} ${equipment.model}` : 'Não identificado'}\nSérie/IMEI: ${equipment?.serial ?? '-'}`);
  y = addSection(pdf, y, 'Defeito relatado', order.problem);
  y = addSection(pdf, y, 'Diagnóstico técnico', order.diagnosis || '-');
  y = addSection(pdf, y, 'Serviços executados', order.servicePerformed || 'Aguardando registro dos serviços executados.');
  y = addSection(
    pdf,
    y,
    'Valores',
    `Serviços/mão de obra: ${money.format(serviceValue)}\nPeças e materiais: ${money.format(materialValue)}\nTOTAL DA NOTA: ${money.format(order.serviceValue)}`,
  );
  y = addSection(pdf, y, 'Garantia', order.warranty || '-');
  y = addSection(pdf, y, 'Observações técnicas', order.technicianNotes || '-');
  y = addSection(pdf, y, 'Conclusão', `Status: ${order.status}\nEntrada: ${order.intakeDate}\nSaída: ${order.exitDate || '-'}`);
  addSection(pdf, y, 'Assinaturas', '\n\nResponsável técnico: ______________________________\n\nCliente: _________________________________________');
  addFooter(pdf, `Nota de Serviço ${order.id.toUpperCase()}`);
  downloadPdf(
    pdf,
    documentFilename('nota-de-servico', client?.name, order.id),
  );
}
