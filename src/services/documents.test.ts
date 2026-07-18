import { beforeEach, expect, test, vi } from 'vitest';

const { addSection, addFooter, downloadPdf, fakePdf } = vi.hoisted(() => ({
  addSection: vi.fn((_pdf, y: number) => y + 20),
  addFooter: vi.fn(),
  downloadPdf: vi.fn(),
  fakePdf: {},
}));

vi.mock('./pdfDocument', () => ({
  createPdf: vi.fn(async () => ({ pdf: fakePdf, y: 44 })),
  addSection,
  addFooter,
  downloadPdf,
}));

import { printServiceOrder } from './orderDocument';
import { printQuote } from './quoteDocument';
import { printServiceNote } from './serviceNoteDocument';

beforeEach(() => {
  addSection.mockClear();
  addFooter.mockClear();
  downloadPdf.mockClear();
});

test('gera o PDF da OS com nome estável', async () => {
  await printServiceOrder({ id: 'os-000003', clientId: 'cli-1', equipmentId: 'eq-1', status: 'Recebido', intakeDate: '2026-07-17', problem: 'Falha de teste', diagnosis: '', history: [] });
  expect(addSection).toHaveBeenCalled();
  expect(downloadPdf).toHaveBeenCalledWith(fakePdf, 'ordem-de-servico-os-000003.pdf');
});

test('gera o PDF do orçamento com itens e total', async () => {
  await printQuote({ id: 'orc-000001', serviceOrderId: 'os-000003', items: [{ id: 'item-1', description: 'Reparo', kind: 'Serviço', quantity: 1, unitPrice: 150 }], discount: 10, deadline: '5 dias', warranty: '90 dias', notes: '', approved: false });
  expect(addSection.mock.calls.flat().join(' ')).toContain('R$ 140,00');
  expect(downloadPdf).toHaveBeenCalledWith(fakePdf, 'orcamento-orc-000001.pdf');
});

test('gera o PDF da nota de serviço com execução e garantia', async () => {
  await printServiceNote({ id: 'os-000003', clientId: 'cli-1', equipmentId: 'eq-1', status: 'Finalizado', intakeDate: '2026-07-17', problem: 'Falha', diagnosis: 'Componente danificado', servicePerformed: 'Substituição do componente e testes', warranty: '90 dias', history: [] });
  expect(addSection.mock.calls.flat().join(' ')).toContain('Substituição do componente e testes');
  expect(downloadPdf).toHaveBeenCalledWith(fakePdf, 'nota-de-servico-os-000003.pdf');
});
