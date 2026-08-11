import {
  ClipboardCheck,
  Clock3,
  PackageCheck,
  ReceiptText,
  RotateCw,
  Truck,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { OrderDocumentButton } from "./OrderDocumentButton";
import {
  Client,
  Equipment,
  FinanceEntry,
  Quote,
  ServiceOrder,
  ServiceStatus,
} from "../types";
import { quoteItems } from "../services/quoteDocument";

type Props = {
  clients: Client[];
  equipment: Equipment[];
  orders: ServiceOrder[];
  finance: FinanceEntry[];
  quotes?: Quote[];
  demo: boolean;
  onSelectStatus?: (status: ServiceStatus) => void;
  onSelectOpenOrders?: () => void;
};
const cards: Array<{
  status: ServiceStatus;
  label: string;
  icon: typeof ClipboardCheck;
  tone: string;
}> = [
  { status: "Recebido", label: "Recebido", icon: ClipboardCheck, tone: "navy" },
  {
    status: "Em análise",
    label: "Em análise",
    icon: ClipboardCheck,
    tone: "blue",
  },
  {
    status: "Aguardando peça",
    label: "Aguardando peça",
    icon: PackageCheck,
    tone: "orange",
  },
  { status: "Em reparo", label: "Em reparo", icon: Wrench, tone: "red" },
  { status: "Finalizado", label: "Finalizado", icon: RotateCw, tone: "purple" },
  { status: "Entregue", label: "Entregue", icon: Truck, tone: "green" },
];
const monthLabels = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
export function OperationsDashboard({
  clients,
  equipment,
  orders,
  finance,
  quotes = [],
  demo,
  onSelectStatus,
  onSelectOpenOrders,
}: Props) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const total = orders.length;
  const openOrders = orders.filter(
    (order) => !["Finalizado", "Entregue"].includes(order.status),
  );
  const revenueEntries = finance.filter((entry) => entry.type === "Receber");
  const netRevenue = (entry: FinanceEntry) => {
    if (typeof entry.serviceAmount === "number") return entry.serviceAmount;
    const quote = quotes.find(
      (item) =>
        item.id === entry.quoteId ||
        entry.description === `Orçamento ${item.id.toUpperCase()}`,
    );
    const materials =
      typeof entry.materialAmount === "number"
        ? entry.materialAmount
        : quote
          ? quoteItems(quote)
              .filter((item) => item.kind === "Peça/material")
              .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
          : 0;
    return Math.max(0, entry.amount - materials);
  };
  const revenueTotal = revenueEntries.reduce(
    (sum, entry) => sum + netRevenue(entry),
    0,
  );
  const receivable = revenueEntries
    .filter((entry) => !entry.paid)
    .reduce((sum, entry) => sum + netRevenue(entry), 0);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const monthlyRevenue = monthLabels.map((_, month) =>
    revenueEntries
      .filter((entry) => {
        const [year, entryMonth] = entry.dueDate.split("-").map(Number);
        return year === currentYear && entryMonth === month + 1;
      })
      .reduce((sum, entry) => sum + netRevenue(entry), 0),
  );
  const monthlyReceivable = monthLabels.map((_, month) =>
    revenueEntries
      .filter((entry) => {
        const [year, entryMonth] = entry.dueDate.split("-").map(Number);
        return !entry.paid && year === currentYear && entryMonth === month + 1;
      })
      .reduce((sum, entry) => sum + netRevenue(entry), 0),
  );
  const selectedRevenue =
    selectedMonth === null ? revenueTotal : monthlyRevenue[selectedMonth];
  const selectedReceivable =
    selectedMonth === null ? receivable : monthlyReceivable[selectedMonth];
  const selectedReceived = selectedRevenue - selectedReceivable;
  const selectedRevenueStatus =
    selectedRevenue === 0
      ? "Sem faturamento"
      : selectedReceivable === 0
        ? "Recebido"
        : selectedReceived > 0
          ? "Parcialmente recebido"
          : "A receber";
  const highestMonthlyRevenue = Math.max(...monthlyRevenue, 1);
  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
  return (
    <section className="operations-dashboard">
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">Visão operacional</span>
          <h2>Dashboard</h2>
        </div>
        <span className={`sync-state ${connected ? "live" : ""}`}>
          <Clock3 size={15} />
          {connected ? "Dados em tempo real" : "Modo demonstração"}
        </span>
      </div>
      <div className="status-metrics">
        {cards.map(({ status, label, icon: Icon, tone }) => {
          const amount = orders.filter(
            (order) => order.status === status,
          ).length;
          return (
            <button
              aria-label={`Ver ${amount} OS com status ${label}`}
              className={`status-card ${tone}`}
              disabled={!amount}
              key={status}
              onClick={() => onSelectStatus?.(status)}
              type="button"
            >
              <span>
                <Icon size={21} />
              </span>
              <small>{label}</small>
              <strong>{amount.toString().padStart(2, "0")}</strong>
            </button>
          );
        })}
        <button
          aria-label={`Ver ${openOrders.length} ordens abertas`}
          className="status-card navy"
          disabled={!openOrders.length}
          onClick={onSelectOpenOrders}
          type="button"
        >
          <span>
            <ReceiptText size={21} />
          </span>
          <small>Ordens abertas</small>
          <strong>
            {openOrders.length.toString().padStart(2, "0")}
          </strong>
        </button>
      </div>
      <div className="dashboard-columns">
        <article className="dashboard-panel order-summary">
          <span className="eyebrow">Ordens por status</span>
          <h3>{total} ordens registradas</h3>
          <div className="order-progress">
            {cards.map(({ status, label, tone }) => {
              const amount = orders.filter(
                (order) => order.status === status,
              ).length;
              const percent = total ? Math.round((amount / total) * 100) : 0;
              return (
                <div className="progress-row" key={status}>
                  <span className={`progress-dot ${tone}`} />
                  <label>{label}</label>
                  <div className="progress-track">
                    <i className={tone} style={{ width: `${percent}%` }} />
                  </div>
                  <strong>{amount}</strong>
                </div>
              );
            })}
          </div>
          <footer>
            <span>{clients.length} clientes</span>
            <span>{equipment.length} equipamentos</span>
          </footer>
        </article>
        <article className="dashboard-panel revenue-summary">
          <span className="eyebrow">Faturamento previsto</span>
          <h3>{money.format(selectedRevenue)}</h3>
          <div className="revenue-period">
            <strong className="positive">
              {selectedMonth === null
                ? "Total anual"
                : `${monthLabels[selectedMonth]} ${currentYear}`}
            </strong>
            {selectedMonth !== null && (
              <button onClick={() => setSelectedMonth(null)} type="button">
                Ver total anual
              </button>
            )}
          </div>
          <div className="revenue-line">
            {monthLabels.map((month, index) => (
              <button
                aria-label={`Ver faturamento de ${month}`}
                aria-pressed={selectedMonth === index}
                className={`revenue-month ${index === currentMonth ? "current" : ""} ${selectedMonth === index ? "selected" : ""}`}
                key={month}
                onClick={() => setSelectedMonth(index)}
                title={`${month}: ${money.format(monthlyRevenue[index])}`}
                type="button"
              >
                <i
                  style={{
                    height: `${Math.max(8, (monthlyRevenue[index] / highestMonthlyRevenue) * 100)}%`,
                  }}
                />
                <span>{month}</span>
              </button>
            ))}
          </div>
          <div className="revenue-values">
            <span>{selectedRevenueStatus}</span>
            <b>
              {money.format(
                selectedRevenueStatus === "Recebido"
                  ? selectedReceived
                  : selectedReceivable,
              )}
            </b>
          </div>
        </article>
      </div>
      <article className="dashboard-panel recent-orders">
        <span className="eyebrow">Acompanhamento</span>
        <h3>Últimas 5 ordens de serviço</h3>
        <div className="recent-order-head">
          <span>OS</span>
          <span>Problema relatado</span>
          <span>Status</span>
          <span>Entrada</span>
          <span />
        </div>
        {recentOrders.map((order) => (
          <div className="recent-order-row" key={order.id}>
            <strong>{order.id.toUpperCase()}</strong>
            <span>{order.problem}</span>
            <em className={statusClass(order.status)}>{order.status}</em>
            <time>{order.intakeDate}</time>
            <OrderDocumentButton
              client={clients.find((client) => client.id === order.clientId)}
              equipment={equipment.find(
                (item) => item.id === order.equipmentId,
              )}
              order={order}
            />
          </div>
        ))}
      </article>
    </section>
  );
}
function statusClass(status: ServiceStatus) {
  if (status === "Em reparo") return "repair";
  if (status === "Aguardando peça") return "waiting";
  if (status === "Entregue") return "delivered";
  return "analysis";
}
