import { Printer } from 'lucide-react';
import { printQuote } from '../services/quoteDocument';
import { Client, Equipment, Quote, ServiceOrder } from '../types';

export function QuoteDocumentButton({ quote, order, client, equipment }: { quote: Quote; order?: ServiceOrder; client?: Client; equipment?: Equipment }) {
  return <button className="document-button" onClick={() => void printQuote(quote, order, client, equipment)} type="button"><Printer size={15}/>Baixar orçamento PDF</button>;
}
