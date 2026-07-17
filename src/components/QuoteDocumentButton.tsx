import { Printer } from 'lucide-react';
import { printQuote } from '../services/quoteDocument';
import { Quote } from '../types';

export function QuoteDocumentButton({ quote }: { quote: Quote }) {
  return <button className="document-button" onClick={() => printQuote(quote)} type="button"><Printer size={15}/>Documento</button>;
}
