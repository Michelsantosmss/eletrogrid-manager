import { Client, Equipment, Quote, ServiceOrder } from '../types';
import { addFooter, addSection, createPdf, downloadPdf } from './pdfDocument';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const quoteItems = (quote: Quote) => quote.items?.length ? quote.items : [
  { id: 'legacy-parts', description: 'Peças e materiais', kind: 'Peça/material' as const, quantity: 1, unitPrice: quote.parts ?? 0 },
  { id: 'legacy-labor', description: 'Mão de obra', kind: 'Serviço' as const, quantity: 1, unitPrice: quote.labor ?? 0 },
].filter((item) => item.unitPrice > 0);

export const quoteTotal = (quote: Quote) => quoteItems(quote).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - quote.discount;

export async function printQuote(quote: Quote, order?: ServiceOrder, client?: Client, equipment?: Equipment) {
  const { pdf, y: startY } = await createPdf('ORÇAMENTO', `${quote.id.toUpperCase()} - ${quote.serviceOrderId.toUpperCase()}`);
  let y = addSection(pdf, startY, 'Cliente', `${client?.name ?? 'Não identificado'}\nCPF/CNPJ: ${client?.document ?? '-'}\nTelefone: ${client?.phone ?? '-'}\nE-mail: ${client?.email ?? '-'}\nCidade: ${client?.city ?? '-'}`);
  y = addSection(pdf, y, 'Equipamento e OS', `${equipment ? `${equipment.brand} ${equipment.model}` : 'Não identificado'}\nSérie/IMEI: ${equipment?.serial ?? '-'}\nOS: ${order?.id.toUpperCase() ?? quote.serviceOrderId.toUpperCase()}\nDefeito relatado: ${order?.problem ?? '-'}`);
  y = addSection(pdf, y, 'Serviços, peças e materiais', quoteItems(quote).map((item) => `${item.quantity} x ${item.description || item.kind} - ${money.format(item.unitPrice)} = ${money.format(item.quantity * item.unitPrice)}`).join('\n'));
  y = addSection(pdf, y, 'Valores', `Subtotal: ${money.format(quoteTotal(quote) + quote.discount)}\nDesconto: ${money.format(quote.discount)}\nTOTAL: ${money.format(quoteTotal(quote))}`);
  y = addSection(pdf, y, 'Prazo e garantia', `Prazo de execução: ${quote.deadline || '-'}\nGarantia: ${quote.warranty || '-'}`);
  addSection(pdf, y, 'Condições e observações', quote.notes || '-');
  addFooter(pdf, `Orçamento ${quote.id.toUpperCase()}`);
  downloadPdf(pdf, `orcamento-${quote.id.toLowerCase()}.pdf`);
}
