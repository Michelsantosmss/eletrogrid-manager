import { afterEach, expect, test, vi } from 'vitest';
import { printServiceOrder } from './orderDocument';
import { printQuote } from './quoteDocument';
import { printServiceNote } from './serviceNoteDocument';

const write = vi.fn();
const close = vi.fn();
const open = vi.fn();

afterEach(() => {
  write.mockReset();
  close.mockReset();
  open.mockReset();
  vi.restoreAllMocks();
});

function mockPrintWindow() {
  vi.spyOn(window, 'open').mockReturnValue({ document: { open, write, close } } as unknown as Window);
}

test('documento de OS inclui a marca EletroGrid e a etiqueta QR', () => {
  mockPrintWindow();
  printServiceOrder({ id: 'os-000003', clientId: 'cli-1', equipmentId: 'eq-1', status: 'Recebido', intakeDate: '2026-07-17', problem: 'Falha de teste', diagnosis: '', qrCode: { value: 'ELETROGRID|OS-000003|eq-1', url: 'https://example.test/qr.png' }, history: [] });

  expect(write).toHaveBeenCalledOnce();
  expect(write.mock.calls[0][0]).toContain('class="brand-name">ELETRO<b>GRID</b>');
  expect(write.mock.calls[0][0]).toContain('ELETROGRID|OS-000003|eq-1');
});

test('documento de orçamento inclui a marca EletroGrid e o total', () => {
  mockPrintWindow();
  printQuote({ id: 'orc-000001', serviceOrderId: 'os-000003', items: [{ id: 'item-1', description: 'Reparo', kind: 'Serviço', quantity: 1, unitPrice: 150 }], discount: 10, deadline: '5 dias', warranty: '90 dias', notes: '', approved: false });

  expect(write).toHaveBeenCalledOnce();
  expect(write.mock.calls[0][0]).toContain('class="brand">ELETRO<b>GRID</b>');
  expect(write.mock.calls[0][0]).toContain('140,00');
});

test('nota de serviço inclui o trabalho executado e a garantia', () => {
  mockPrintWindow();
  printServiceNote({ id: 'os-000003', clientId: 'cli-1', equipmentId: 'eq-1', status: 'Finalizado', intakeDate: '2026-07-17', problem: 'Falha', diagnosis: 'Componente danificado', servicePerformed: 'Substituição do componente e testes', warranty: '90 dias', history: [] });

  expect(write.mock.calls[0][0]).toContain('NOTA DE SERVIÇO');
  expect(write.mock.calls[0][0]).toContain('Substituição do componente e testes');
  expect(write.mock.calls[0][0]).toContain('90 dias');
});
