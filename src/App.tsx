import { FormEvent, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BatteryCharging,
  Bolt,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Gauge,
  MapPin,
  Search,
  UsersRound,
  Zap,
} from 'lucide-react';

type Priority = 'Alta' | 'Média' | 'Baixa';
type TeamStatus = 'Em atendimento' | 'Inspeção preventiva' | 'Disponível';

type ServiceOrder = {
  id: string;
  priority: Priority;
  customer: string;
  issue: string;
  time: string;
};

type Team = {
  name: string;
  area: string;
  status: TeamStatus;
  eta: string;
};

const teams: Team[] = [
  { name: 'Equipe Alfa', area: 'Subestação Norte', status: 'Em atendimento', eta: '14 min' },
  { name: 'Equipe Delta', area: 'Alimentador C-17', status: 'Inspeção preventiva', eta: '38 min' },
  { name: 'Equipe Solar', area: 'Parque Fotovoltaico 02', status: 'Disponível', eta: 'Pronta' },
];

const initialTickets: ServiceOrder[] = [
  { id: 'OS-2048', priority: 'Alta', customer: 'Hospital São Lucas', issue: 'Oscilação de tensão', time: '09:42' },
  { id: 'OS-2049', priority: 'Média', customer: 'Condomínio Ipê', issue: 'Vistoria de medição', time: '10:15' },
  { id: 'OS-2050', priority: 'Baixa', customer: 'Mercado Central', issue: 'Ligação nova', time: '11:05' },
];

const priorityOptions: Priority[] = ['Alta', 'Média', 'Baixa'];

function App() {
  const [tickets, setTickets] = useState<ServiceOrder[]>(initialTickets);
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'Todas' | Priority>('Todas');
  const [newTicket, setNewTicket] = useState({ customer: '', issue: '', priority: 'Média' as Priority });

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesPriority = priorityFilter === 'Todas' || ticket.priority === priorityFilter;
      const searchable = `${ticket.id} ${ticket.customer} ${ticket.issue}`.toLowerCase();
      return matchesPriority && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [priorityFilter, query, tickets]);

  const criticalTickets = tickets.filter((ticket) => ticket.priority === 'Alta').length;
  const availableTeams = teams.filter((team) => team.status === 'Disponível').length;
  const monitoredNetwork = criticalTickets > 2 ? '96,9%' : '98,7%';
  const nextTicketId = `OS-${2048 + tickets.length}`;

  const metrics = [
    { label: 'Unidades consumidoras', value: '3.248', trend: '+12%', icon: Building2 },
    { label: 'Ordens em campo', value: String(tickets.length), trend: `${criticalTickets} críticas`, icon: ClipboardList },
    { label: 'Rede monitorada', value: monitoredNetwork, trend: 'tempo real', icon: Activity },
    { label: 'Equipes disponíveis', value: String(availableTeams), trend: `${teams.length} cadastradas`, icon: AlertTriangle },
  ];

  function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTicket.customer.trim() || !newTicket.issue.trim()) {
      return;
    }

    const createdAt = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    setTickets((currentTickets) => [
      {
        id: nextTicketId,
        priority: newTicket.priority,
        customer: newTicket.customer.trim(),
        issue: newTicket.issue.trim(),
        time: createdAt,
      },
      ...currentTickets,
    ]);
    setNewTicket({ customer: '', issue: '', priority: 'Média' });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Zap size={24} /></span>
          <div>
            <strong>Eletrogrid</strong>
            <small>Manager</small>
          </div>
        </div>
        <nav>
          <a className="active" href="#dashboard"><Gauge size={18} /> Dashboard</a>
          <a href="#clientes"><UsersRound size={18} /> Clientes</a>
          <a href="#operacoes"><Bolt size={18} /> Operações</a>
          <a href="#agenda"><CalendarClock size={18} /> Agenda</a>
        </nav>
        <section className="sidebar-card">
          <BatteryCharging size={28} />
          <strong>Carga do sistema</strong>
          <p>Pico previsto às 18h30 com reserva operacional segura.</p>
        </section>
      </aside>

      <section className="content">
        <header className="hero" id="dashboard">
          <div>
            <span className="eyebrow"><CheckCircle2 size={16} /> Centro de controle online</span>
            <h1>Gestão inteligente para redes elétricas, equipes e clientes.</h1>
            <p>Monitore indicadores, priorize ordens de serviço e acompanhe equipes em campo em uma única visão operacional.</p>
          </div>
          <label className="search-box">
            <Search size={18} />
            <input
              aria-label="Buscar"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente, OS ou subestação"
              value={query}
            />
          </label>
        </header>

        <section className="metrics-grid" aria-label="Indicadores principais">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className="metric-card" key={metric.label}>
                <span><Icon size={22} /></span>
                <small>{metric.label}</small>
                <strong>{metric.value}</strong>
                <em>{metric.trend}</em>
              </article>
            );
          })}
        </section>

        <section className="panel-grid" id="operacoes">
          <article className="panel large-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Operação em tempo real</span>
                <h2>Mapa de disponibilidade</h2>
              </div>
              <button>Ver rede <ArrowUpRight size={16} /></button>
            </div>
            <div className="network-map" role="img" aria-label="Mapa abstrato da rede elétrica">
              <span className="node node-a" />
              <span className="node node-b" />
              <span className="node node-c warning" />
              <span className="node node-d" />
              <span className="line line-1" />
              <span className="line line-2" />
              <span className="line line-3" />
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading compact">
              <h2>Equipes em campo</h2>
              <MapPin size={18} />
            </div>
            <div className="team-list">
              {teams.map((team) => (
                <div className="team-row" key={team.name}>
                  <div>
                    <strong>{team.name}</strong>
                    <span>{team.area}</span>
                  </div>
                  <small>{team.status} · {team.eta}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel tickets-panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Triagem</span>
              <h2>Ordens de serviço recentes</h2>
            </div>
            <div className="filter-group" aria-label="Filtro por prioridade">
              {(['Todas', ...priorityOptions] as const).map((priority) => (
                <button
                  className={priorityFilter === priority ? 'ghost-button active' : 'ghost-button'}
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  type="button"
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <form className="ticket-form" onSubmit={handleCreateTicket}>
            <input
              aria-label="Cliente"
              onChange={(event) => setNewTicket((ticket) => ({ ...ticket, customer: event.target.value }))}
              placeholder="Cliente"
              value={newTicket.customer}
            />
            <input
              aria-label="Ocorrência"
              onChange={(event) => setNewTicket((ticket) => ({ ...ticket, issue: event.target.value }))}
              placeholder="Ocorrência"
              value={newTicket.issue}
            />
            <select
              aria-label="Prioridade"
              onChange={(event) => setNewTicket((ticket) => ({ ...ticket, priority: event.target.value as Priority }))}
              value={newTicket.priority}
            >
              {priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
            <button type="submit">Abrir {nextTicketId}</button>
          </form>

          <div className="ticket-table">
            {filteredTickets.map((ticket) => (
              <div className="ticket-row" key={ticket.id}>
                <strong>{ticket.id}</strong>
                <span className={`priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                <span>{ticket.customer}</span>
                <span>{ticket.issue}</span>
                <small>{ticket.time}</small>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <p className="empty-state">Nenhuma ordem encontrada para a busca ou prioridade selecionada.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
