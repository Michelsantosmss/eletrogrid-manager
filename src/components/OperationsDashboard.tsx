import { ClipboardCheck, Clock3, PackageCheck, ReceiptText, RotateCw, Truck, Wrench } from 'lucide-react';
import { OrderDocumentButton } from './OrderDocumentButton';
import { Client, Equipment, FinanceEntry, ServiceOrder, ServiceStatus } from '../types';

type Props = {
  clients: Client[];
  equipment: Equipment[];
  orders: ServiceOrder[];
  finance: FinanceEntry[];
  demo: boolean;
};
const cards: Array<{ status: ServiceStatus; label: string; icon: typeof ClipboardCheck; tone: string }> = [
  { status: 'Em análise', label: 'Em diagnóstico', icon: ClipboardCheck, tone: 'blue' }, { status: 'Aguardando peça', label: 'Aguardando peças', icon: PackageCheck, tone: 'orange' }, { status: 'Em reparo', label: 'Em reparo', icon: Wrench, tone: 'red' }, { status: 'Finalizado', label: 'Em testes', icon: RotateCw, tone: 'purple' }, { status: 'Entregue', label: 'Prontos para entrega', icon: Truck, tone: 'green' },
];
export function OperationsDashboard({ clients, equipment, orders, finance, demo }: Props) {
  const total = orders.length;
  const revenueEntries = finance.filter((entry) => entry.type === 'Receber');
  const revenueTotal = revenueEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const receivable = revenueEntries.filter((entry) => !entry.paid).reduce((sum, entry) => sum + entry.amount, 0);
  const received = revenueTotal - receivable;
  const revenueStatus = revenueTotal === 0 ? 'Sem faturamento' : receivable === 0 ? 'Recebido' : received > 0 ? 'Parcialmente recebido' : 'A receber';
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const connected = !demo;
  return <section className="operations-dashboard"><div className="dashboard-title"><div><span className="eyebrow">Visão operacional</span><h2>Dashboard</h2></div><span className={`sync-state ${connected ? 'live' : ''}`}><Clock3 size={15}/>{connected ? 'Dados em tempo real' : 'Modo demonstração'}</span></div><div className="status-metrics">{cards.map(({ status, label, icon: Icon, tone }) => <article className={`status-card ${tone}`} key={status}><span><Icon size={21}/></span><small>{label}</small><strong>{orders.filter((order) => order.status === status).length.toString().padStart(2, '0')}</strong></article>)}<article className="status-card navy"><span><ReceiptText size={21}/></span><small>Ordens abertas</small><strong>{orders.filter((order) => !['Finalizado', 'Entregue'].includes(order.status)).length.toString().padStart(2, '0')}</strong></article></div><div className="dashboard-columns"><article className="dashboard-panel order-summary"><span className="eyebrow">Ordens por status</span><h3>{total} ordens registradas</h3><div className="order-progress">{cards.map(({ status, label, tone }) => { const amount = orders.filter((order) => order.status === status).length; const percent = total ? Math.round((amount / total) * 100) : 0; return <div className="progress-row" key={status}><span className={`progress-dot ${tone}`}/><label>{label}</label><div className="progress-track"><i className={tone} style={{ width: `${percent}%` }}/></div><strong>{amount}</strong></div>; })}</div><footer><span>{clients.length} clientes</span><span>{equipment.length} equipamentos</span></footer></article><article className="dashboard-panel revenue-summary"><span className="eyebrow">Faturamento previsto</span><h3>{money.format(revenueTotal)}</h3><strong className="positive">Operação atual</strong><div className="revenue-line"><i/><i/><i/><i/><i/><i/><i/></div><div className="revenue-values"><span>{revenueStatus}</span><b>{money.format(revenueStatus === 'Recebido' ? received : receivable)}</b></div></article></div><article className="dashboard-panel recent-orders"><span className="eyebrow">Acompanhamento</span><h3>Ordens recentes</h3><div className="recent-order-head"><span>OS</span><span>Problema relatado</span><span>Status</span><span>Entrada</span><span/></div>{orders.slice(0, 5).map((order) => <div className="recent-order-row" key={order.id}><strong>{order.id.toUpperCase()}</strong><span>{order.problem}</span><em className={statusClass(order.status)}>{order.status}</em><time>{order.intakeDate}</time><OrderDocumentButton client={clients.find((client) => client.id === order.clientId)} equipment={equipment.find((item) => item.id === order.equipmentId)} order={order}/></div>)}</article></section>;
}
function statusClass(status: ServiceStatus) { if (status === 'Em reparo') return 'repair'; if (status === 'Aguardando peça') return 'waiting'; if (status === 'Entregue') return 'delivered'; return 'analysis'; }
