import { afterEach, expect, test, vi } from 'vitest';
import { printServiceOrder } from './orderDocument';
import { printQuote } from './quoteDocument';

const write = vi.fn();
const close = vi.fn();

afterEach(() => {
  write.mockReset();
  close.mockReset();
  vi.restoreAllMocks();
});

function mockPrintWindow() {
  vi.spyOn(window, 'open').mockReturnValue({ document: { write, close } } as unknown as Window);
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
  printQuote({ id: 'orc-000001', serviceOrderId: 'os-000003', parts: 100, labor: 50, discount: 10, approved: false });

  expect(write).toHaveBeenCalledOnce();
  expect(write.mock.calls[0][0]).toContain('class="brand-name">ELETRO<b>GRID</b>');
  expect(write.mock.calls[0][0]).toContain('140,00');
});
