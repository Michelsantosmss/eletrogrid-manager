import { Client, Equipment, FinanceEntry, Quote, ServiceOrder } from '../types';

export const clientsSeed: Client[] = [
  { id: 'cli-1', name: 'Hospital São Lucas', document: '12.345.678/0001-90', phone: '(11) 4002-8922', email: 'manutencao@saolucas.com.br', city: 'São Paulo' },
  { id: 'cli-2', name: 'Condomínio Ipê', document: '98.765.432/0001-10', phone: '(11) 3222-1100', email: 'sindico@ipe.com.br', city: 'Guarulhos' },
  { id: 'cli-3', name: 'Indústria Aurora', document: '45.111.222/0001-33', phone: '(19) 3888-7070', email: 'energia@aurora.ind.br', city: 'Campinas' },
];
export const equipmentSeed: Equipment[] = [
  { id: 'eq-1', clientId: 'cli-1', category: 'Eletrônico', brand: 'APC', model: 'Nobreak Smart 3kVA', serial: 'APC-8844', notes: 'Falha intermitente em carga alta.' },
  { id: 'eq-2', clientId: 'cli-2', category: 'Elétrico', brand: 'WEG', model: 'Quadro QGBT', serial: 'QGBT-221', notes: 'Inspeção termográfica preventiva.' },
  { id: 'eq-3', clientId: 'cli-3', category: 'Energia solar', brand: 'Fronius', model: 'Inversor Primo', serial: 'FR-7781', notes: 'Baixa geração no string 2.' },
];
export const orderSeed: ServiceOrder[] = [
  { id: 'os-1', clientId: 'cli-1', equipmentId: 'eq-1', status: 'Em análise', intakeDate: '2026-07-12', problem: 'Oscilação e desligamento automático.', diagnosis: 'Aguardando teste de baterias.', history: [{ at: '2026-07-12 09:00', status: 'Recebido', note: 'Equipamento recebido na bancada.' }, { at: '2026-07-12 14:20', status: 'Em análise', note: 'Técnico iniciou diagnóstico.' }] },
  { id: 'os-2', clientId: 'cli-3', equipmentId: 'eq-3', status: 'Aguardando peça', intakeDate: '2026-07-13', problem: 'Inversor não sincroniza.', diagnosis: 'Placa de comunicação com defeito.', history: [{ at: '2026-07-13 10:10', status: 'Recebido', note: 'Registro aberto em campo.' }, { at: '2026-07-14 08:30', status: 'Aguardando peça', note: 'Solicitada placa de comunicação.' }] },
];
export const quoteSeed: Quote[] = [{ id: 'orc-1', serviceOrderId: 'os-2', parts: 980, labor: 420, discount: 80, approved: false }];
export const financeSeed: FinanceEntry[] = [{ id: 'fin-1', type: 'Receber', description: 'Sinal orçamento OS-2', amount: 600, dueDate: '2026-07-20', paid: false }, { id: 'fin-2', type: 'Pagar', description: 'Fornecedor placa comunicação', amount: 520, dueDate: '2026-07-18', paid: true }];
