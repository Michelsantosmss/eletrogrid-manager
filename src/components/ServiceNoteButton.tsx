import { ClipboardCheck } from 'lucide-react';
import { printServiceNote } from '../services/serviceNoteDocument';
import { Client, Equipment, Quote, ServiceOrder } from '../types';

export function ServiceNoteButton({ client, equipment, order, quote }: { client?: Client; equipment?: Equipment; order: ServiceOrder; quote?: Quote }) {
  const hasValue = Boolean(order.serviceValue && order.serviceValue > 0);
  return <button className="document-button" disabled={!hasValue} title={hasValue ? 'Baixar Nota de Serviço' : 'Informe o valor do serviço'} onClick={() => void printServiceNote(order, client, equipment, quote)} type="button"><ClipboardCheck size={15}/>{hasValue ? 'Baixar nota PDF' : 'Informe o valor'}</button>;
}
