import { ClipboardCheck, Clock3, PackageCheck, ReceiptText, RotateCw, Truck, Wrench } from 'lucide-react';
import { OrderDocumentButton } from './OrderDocumentButton';
import { Client, Equipment, FinanceEntry, Quote, ServiceOrder, ServiceStatus } from '../types';
import { quoteItems } from '../services/quoteDocument';

type Props = {
  clients: Client[];
  equipment: Equipment[];
  orders: ServiceOrder[];
  finance: FinanceEntry[];
  quotes?: Quote[];
  demo: boolean;
};
const cards: Array<{ status: ServiceStatus; label: string; icon: typeof ClipboardCheck; tone: string }> = [
  { status: 'Recebido', label: 'Recebido', icon: ClipboardCheck, tone: 'navy' },
  { status: 'Em análise', label: 'Em análise', icon: ClipboardCheck, tone: 'blue' },
  { status: 'Aguardando peça', label: 'Aguardando peça', icon: PackageCheck, tone: 'orange' },
  { status: 'Em reparo', label: 'Em reparo', icon: Wrench, tone: 'red' },
  { status: 'Finalizado', label: 'Finalizado', icon: RotateCw, tone: 'purple' },
  { status: 'Entregue', label: 'Entregue', icon: Truck, tone: 'green' },
];
const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export function OperationsDashboard({ clients, equipment, orders, finance, quotes = [], demo }: Props) {
  const total = orders.length;
  const revenueEntries = finance.filter((entry) => entry.type === 'Receber');
  const netRevenue = (entry: FinanceEntry) => {
    if (typeof entry.serviceAmount === 'number') return entry.serviceAmount;
    const quote = quotes.find((item) => item.id === entry.quoteId || entry.description === `Orçamento ${item.id.toUpperCase()}`);
    const materials = typeof entry.materialAmount === 'number'
      ? entry.materialAmount
      : quote
        ? quoteItems(quote).filter((item) => item.kind === 'Peça/material').reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
        : 0;
    return Math.max(0, entry.amount - materials);
  };
  const revenueTotal = revenueEntries.reduce((sum, entry) => sum + netRevenue(entry), 0);
  const receivable = revenueEntries.filter((entry) => !entry.paid).reduce((sum, entry) => sum + netRevenue(entry), 0);
  const received = revenueTotal - receivable;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const monthlyRevenue = monthLabels.map((_, month) => revenueEntries
    .filter((entry) => {
      const [year, entryMonth] = entry.dueDate.split('-').map(Number);
      return year === currentYear && entryMonth === month + 1;
    })
    .reduce((sum, entry) => sum + netRevenue(entry), 0));
  const highestMonthlyRevenue = Math.max(...monthlyRevenue, 1);
  const revenueStatus = revenueTotal === 0 ? 'Sem faturamento' : receivable === 0 ? 'Recebido' : received > 0 ? 'Parcialmente recebido' : 'A receber';
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const connected = !demo;
  const recentOrders = [...orders]
    .sort((a, b) => {
      const dateComparison = b.intakeDate.localeCompare(a.intakeDate);
      if (dateComparison) return dateComparison;
      const aNumber = Number(a.id.match(/(\d+)$/)?.[1] ?? 0);
      const bNumber = Number(b.id.match(/(\d+)$/)?.[1] ?? 0);
      return bNumber - aNumber;
    })
    .slice(0, 5);
  return <section className="operations-dashboard"><div className="dashboard-title"><div><span className="eyebrow">Visão operacional</span><h2>Dashboard</h2></div><span className={`sync-state ${connected ? 'live' : ''}`}><Clock3 size={15}/>{connected ? 'Dados em tempo real' : 'Modo demonstração'}</span></div><div className="status-metrics">{cards.map(({ status, label, icon: Icon, tone }) => <article className={`status-card ${tone}`} key={status}><span><Icon size={21}/></span><small>{label}</small><strong>{orders.filter((order) => order.status === status).length.toString().padStart(2, '0')}</strong></article>)}<article className="status-card navy"><span><ReceiptText size={21}/></span><small>Ordens abertas</small><strong>{orders.filter((order) => !['Finalizado', 'Entregue'].includes(order.status)).length.toString().padStart(2, '0')}</strong></article></div><div className="dashboard-columns"><article className="dashboard-panel order-summary"><span className="eyebrow">Ordens por status</span><h3>{total} ordens registradas</h3><div className="order-progress">{cards.map(({ status, label, tone }) => { const amount = orders.filter((order) => order.status === status).length; const percent = total ? Math.round((amount / total) * 100) : 0; return <div className="progress-row" key={status}><span className={`progress-dot ${tone}`}/><label>{label}</label><div className="progress-track"><i className={tone} style={{ width: `${percent}%` }}/></div><strong>{amount}</strong></div>; })}</div><footer><span>{clients.length} clientes</span><span>{equipment.length} equipamentos</span></footer></article><article className="dashboard-panel revenue-summary"><span className="eyebrow">Faturamento previsto</span><h3>{money.format(revenueTotal)}</h3><strong className="positive">Operação atual</strong><div className="revenue-line">{monthLabels.map((month, index) => <div className={`revenue-month ${index === currentMonth ? 'current' : ''}`} key={month} title={`${month}: ${money.format(monthlyRevenue[index])}`}><i style={{ height: `${Math.max(8, (monthlyRevenue[index] / highestMonthlyRevenue) * 100)}%` }}/><span>{month}</span></div>)}</div><div className="revenue-values"><span>{revenueStatus}</span><b>{money.format(revenueStatus === 'Recebido' ? received : receivable)}</b></div></article></div><article className="dashboard-panel recent-orders"><span className="eyebrow">Acompanhamento</span><h3>Últimas 5 ordens de serviço</h3><div className="recent-order-head"><span>OS</span><span>Problema relatado</span><span>Status</span><span>Entrada</span><span/></div>{recentOrders.map((order) => <div className="recent-order-row" key={order.id}><strong>{order.id.toUpperCase()}</strong><span>{order.problem}</span><em className={statusClass(order.status)}>{order.status}</em><time>{order.intakeDate}</time><OrderDocumentButton client={clients.find((client) => client.id === order.clientId)} equipment={equipment.find((item) => item.id === order.equipmentId)} order={order}/></div>)}</article></section>;
}
function statusClass(status: ServiceStatus) { if (status === 'Em reparo') return 'repair'; if (status === 'Aguardando peça') return 'waiting'; if (status === 'Entregue') return 'delivered'; return 'analysis'; }
