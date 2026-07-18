import { expect, test } from 'vitest';
import { resolveOrderRelations } from '../App';
import { Client, Equipment, ServiceOrder } from '../types';

const client: Client = { id: 'cli-real', name: 'Cliente Real', document: '123', phone: '11999999999', email: 'cliente@teste.com', city: 'São Paulo' };
const equipment: Equipment = { id: 'eq-real', clientId: client.id, category: 'Eletrônico', brand: 'Marca', model: 'Modelo', serial: 'ABC', notes: '' };
const legacyOrder: ServiceOrder = { id: 'os-000001', clientId: 'cli-1', equipmentId: 'eq-1', status: 'Em análise', intakeDate: '2026-07-18', problem: 'Falha', diagnosis: '', history: [] };

test('recupera cliente e equipamento únicos em uma OS antiga com vínculos inválidos', () => {
  expect(resolveOrderRelations(legacyOrder, [client], [equipment])).toEqual({ client, equipment });
});

test('não escolhe automaticamente quando existem registros ambíguos', () => {
  const secondClient = { ...client, id: 'cli-outro', name: 'Outro cliente' };
  const secondEquipment = { ...equipment, id: 'eq-outro', clientId: secondClient.id };
  expect(resolveOrderRelations(legacyOrder, [client, secondClient], [equipment, secondEquipment])).toEqual({ client: undefined, equipment: undefined });
});
