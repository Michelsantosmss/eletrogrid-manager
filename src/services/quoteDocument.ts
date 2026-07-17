import { Quote } from '../types';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character));

export const quoteItems = (quote: Quote) => quote.items?.length ? quote.items : [
  { id: 'legacy-parts', description: 'Peças e materiais', kind: 'Peça/material' as const, quantity: 1, unitPrice: quote.parts ?? 0 },
  { id: 'legacy-labor', description: 'Mão de obra', kind: 'Serviço' as const, quantity: 1, unitPrice: quote.labor ?? 0 },
].filter((item) => item.unitPrice > 0);

export const quoteTotal = (quote: Quote) => quoteItems(quote).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - quote.discount;

export function printQuote(quote: Quote) {
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) return;
  const rows = quoteItems(quote).map((item) => `<tr><td>${escapeHtml(item.description)}</td><td>${item.kind}</td><td class="right">${item.quantity}</td><td class="right">${money.format(item.unitPrice)}</td><td class="right">${money.format(item.quantity * item.unitPrice)}</td></tr>`).join('');
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Orçamento ${quote.id.toUpperCase()}</title><style>*{box-sizing:border-box}body{margin:0;color:#122342;font:13px Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:auto;padding:14mm}.header{display:flex;justify-content:space-between;border-bottom:5px solid #f68b1f;padding-bottom:12px}.brand{font-size:20px;font-weight:900;color:#08295d}.brand b{color:#f68b1f}.title{text-align:right;color:#0a306d}.title h1{font-size:20px;margin:0}.title p{margin:4px 0}.box{border:1px solid #cbd5e1;margin-top:16px;padding:11px}.box h2{font-size:10px;color:#0a306d;margin:-11px -11px 10px;padding:7px 11px;background:#edf3fb;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#0a306d;color:#fff;text-align:left;padding:9px}td{border:1px solid #d8e0eb;padding:9px}.right{text-align:right}.total{background:#0a306d;color:#fff;font-weight:900;font-size:15px}.footer{position:fixed;bottom:10mm;left:14mm;right:14mm;border-top:3px solid #0a306d;padding-top:8px;color:#53657f;display:flex;justify-content:space-between;font-size:9px}@media print{.page{padding:0}}</style></head><body><main class="page"><header class="header"><div class="brand">ELETRO<b>GRID</b></div><div class="title"><h1>ORÇAMENTO</h1><p>${quote.id.toUpperCase()}</p><p>${quote.serviceOrderId.toUpperCase()}</p></div></header><section class="box"><h2>Serviço proposto</h2><p>Itens relacionados à Ordem de Serviço ${quote.serviceOrderId.toUpperCase()}.</p></section><table><thead><tr><th>Descrição</th><th>Tipo</th><th class="right">Qtd.</th><th class="right">Unitário</th><th class="right">Total</th></tr></thead><tbody>${rows}<tr><td colspan="4">Desconto</td><td class="right">-${money.format(quote.discount)}</td></tr><tr class="total"><td colspan="4">TOTAL</td><td class="right">${money.format(quoteTotal(quote))}</td></tr></tbody></table><section class="box"><h2>Condições</h2><p><b>Prazo:</b> ${escapeHtml(quote.deadline || '-')}</p><p><b>Garantia:</b> ${escapeHtml(quote.warranty || '-')}</p><p>${escapeHtml(quote.notes || '')}</p></section><footer class="footer"><span>EletroGrid Manager · ${quote.id.toUpperCase()}</span><span>Gerado em ${new Date().toLocaleString('pt-BR')}</span></footer></main><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
}
