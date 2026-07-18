import { ClipboardCheck } from 'lucide-react';
import { printServiceNote } from '../services/serviceNoteDocument';
import { Client, Equipment, ServiceOrder } from '../types';

export function ServiceNoteButton({ client, equipment, order }: { client?: Client; equipment?: Equipment; order: ServiceOrder }) {
  return <button className="document-button" onClick={() => void printServiceNote(order, client, equipment)} type="button"><ClipboardCheck size={15}/>Baixar nota PDF</button>;
}
