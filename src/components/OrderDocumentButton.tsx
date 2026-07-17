import { Printer } from 'lucide-react';
import { printServiceOrder } from '../services/orderDocument';
import { Client, Equipment, ServiceOrder } from '../types';

export function OrderDocumentButton({ client, equipment, order }: { client?: Client; equipment?: Equipment; order: ServiceOrder }) {
  return <button className="document-button" onClick={() => printServiceOrder(order, client, equipment)} type="button"><Printer size={15}/>Documento</button>;
}
