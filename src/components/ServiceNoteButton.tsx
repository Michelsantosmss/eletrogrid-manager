import { ClipboardCheck } from 'lucide-react';
import { printServiceNote } from '../services/serviceNoteDocument';
import { Client, Equipment, ServiceOrder } from '../types';

export function ServiceNoteButton({ client, equipment, order }: { client?: Client; equipment?: Equipment; order: ServiceOrder }) {
  const hasValue = Boolean(order.serviceValue && order.serviceValue > 0);
  return <button className="document-button" disabled={!hasValue} title={hasValue ? 'Baixar Nota de Serviço' : 'Informe o valor do serviço'} onClick={() => void printServiceNote(order, client, equipment)} type="button"><ClipboardCheck size={15}/>{hasValue ? 'Baixar nota PDF' : 'Informe o valor'}</button>;
}
