import { FormEvent, useMemo, useState } from 'react';
import { Activity, BanknoteArrowUp, FileText, HardDrive, LogOut, Search, ShieldCheck, UserRoundPlus, UsersRound, Wrench, Zap } from 'lucide-react';
import { Section } from './components/Section';
import { loginWithEmail, logout, registerWithEmail, saveRecord } from './services/firebase';
import { clientsSeed, equipmentSeed, financeSeed, orderSeed, quoteSeed } from './services/seedData';
import { Client, Equipment, FinanceEntry, Quote, ServiceOrder, ServiceStatus } from './types';
import './styles.css';

const serviceStatuses: ServiceStatus[] = ['Recebido', 'Em análise', 'Aguardando peça', 'Em reparo', 'Finalizado', 'Entregue'];
const modules = ['Dashboard', 'Clientes', 'Equipamentos', 'Ordens de serviço', 'Orçamentos', 'Financeiro'] as const;
type Module = typeof modules[number];

const makeId = (prefix: string) => `tmp-${prefix}-${Date.now()}`;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function App() {
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState<Module>('Dashboard');
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>(clientsSeed);
  const [equipment, setEquipment] = useState<Equipment[]>(equipmentSeed);
  const [orders, setOrders] = useState<ServiceOrder[]>(orderSeed);
  const [quotes, setQuotes] = useState<Quote[]>(quoteSeed);
  const [finance, setFinance] = useState<FinanceEntry[]>(financeSeed);
  const [clientForm, setClientForm] = useState({ name: '', document: '', phone: '', email: '', city: '' });
  const [equipmentForm, setEquipmentForm] = useState({ clientId: 'cli-1', category: 'Eletrônico' as Equipment['category'], brand: '', model: '', serial: '', notes: '' });
  const [orderForm, setOrderForm] = useState({ clientId: 'cli-1', equipmentId: 'eq-1', problem: '', diagnosis: '' });

  const filteredClients = useMemo(() => clients.filter((client) => `${client.name} ${client.document} ${client.city}`.toLowerCase().includes(search.toLowerCase())), [clients, search]);
  const filteredEquipment = useMemo(() => equipment.filter((item) => `${item.brand} ${item.model} ${item.serial}`.toLowerCase().includes(search.toLowerCase())), [equipment, search]);
  const cashFlow = finance.reduce((total, entry) => total + (entry.type === 'Receber' ? entry.amount : -entry.amount), 0);
  const openOrders = orders.filter((order) => !['Finalizado', 'Entregue'].includes(order.status)).length;

  async function handleAuth(event: FormEvent<HTMLFormElement>, mode: 'login' | 'register') {
    event.preventDefault();
    setAuthError('');
    try {
      if (mode === 'login') await loginWithEmail(userEmail, password);
      if (mode === 'register') await registerWithEmail(userEmail, password);
      setAuthenticated(true);
    } catch (error) {
      setAuthError('Não foi possível autenticar no Firebase. Verifique credenciais e variáveis VITE_FIREBASE_*.' );
    }
  }

  function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientForm.name || !clientForm.phone) return;
    const client = { id: makeId('client'), ...clientForm };
    setClients((current) => [client, ...current]);
    void saveRecord('clients', client).catch(console.error);
    setClientForm({ name: '', document: '', phone: '', email: '', city: '' });
  }

  function addEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!equipmentForm.brand || !equipmentForm.model) return;
    const item = { id: makeId('equipment'), ...equipmentForm };
    setEquipment((current) => [item, ...current]);
    void saveRecord('equipment', item).catch(console.error);
    setEquipmentForm({ clientId: clients[0]?.id ?? '', category: 'Eletrônico', brand: '', model: '', serial: '', notes: '' });
  }

  function addOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orderForm.problem) return;
    const order: ServiceOrder = {
      id: makeId('order'),
      ...orderForm,
      status: 'Recebido',
      intakeDate: new Date().toISOString().slice(0, 10),
      history: [{ at: new Date().toLocaleString('pt-BR'), status: 'Recebido', note: 'Entrada registrada no sistema.' }],
    };
    setOrders((current) => [order, ...current]);
    void saveRecord('serviceOrders', order).catch(console.error);
    setOrderForm({ clientId: clients[0]?.id ?? '', equipmentId: equipment[0]?.id ?? '', problem: '', diagnosis: '' });
  }

  function updateOrderStatus(orderId: string, status: ServiceStatus) {
    setOrders((current) => current.map((order) => order.id === orderId ? {
      ...order,
      status,
      exitDate: status === 'Entregue' ? new Date().toISOString().slice(0, 10) : order.exitDate,
      history: [...order.history, { at: new Date().toLocaleString('pt-BR'), status, note: `Status alterado para ${status}.` }],
    } : order));
  }

  function createQuote(orderId: string) {
    const quote: Quote = { id: makeId('quote'), serviceOrderId: orderId, parts: 350, labor: 250, discount: 0, approved: false };
    setQuotes((current) => [quote, ...current]);
    setActiveModule('Orçamentos');
  }

  function approveQuote(quoteId: string) {
    setQuotes((current) => current.map((quote) => quote.id === quoteId ? { ...quote, approved: true } : quote));
    const quote = quotes.find((item) => item.id === quoteId);
    if (!quote) return;
    setFinance((current) => [{ id: makeId('finance'), type: 'Receber', description: `Orçamento ${quote.id}`, amount: quote.parts + quote.labor - quote.discount, dueDate: new Date().toISOString().slice(0, 10), paid: false }, ...current]);
  }

  if (!isAuthenticated) {
    return (
      <main className="login-screen">
        <form className="login-card" onSubmit={(event) => handleAuth(event, 'login')}>
          <span className="brand-mark"><Zap size={28} /></span>
          <h1>EletroGrid Manager</h1>
          <p>Assistência técnica para eletrônicos, energia solar e serviços elétricos.</p>
          <input aria-label="E-mail" onChange={(event) => setUserEmail(event.target.value)} placeholder="E-mail" type="email" value={userEmail} required />
          <input aria-label="Senha" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" value={password} required />
          {authError && <strong className="form-error">{authError}</strong>}
          <button type="submit">Entrar com Firebase</button>
          <button className="ghost-button" onClick={(event) => handleAuth(event as unknown as FormEvent<HTMLFormElement>, 'register')} type="button">Criar acesso</button>
          <button className="link-button" onClick={() => setAuthenticated(true)} type="button">Acessar modo demonstração</button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Zap size={24} /></span><div><strong>EletroGrid</strong><small>Manager</small></div></div>
        <nav>{modules.map((module) => <button className={activeModule === module ? 'nav-button active' : 'nav-button'} key={module} onClick={() => setActiveModule(module)} type="button">{module}</button>)}</nav>
        <button className="logout-button" onClick={() => { void logout(); setAuthenticated(false); }} type="button"><LogOut size={18} /> Sair</button>
      </aside>
      <section className="content">
        <header className="hero"><div><span className="eyebrow"><ShieldCheck size={16} /> Operação integrada</span><h1>Sistema completo para assistência técnica ELETROGRID.</h1><p>Clientes, equipamentos, ordens de serviço, orçamentos, financeiro e Firebase em uma base organizada.</p></div><label className="search-box"><Search size={18}/><input aria-label="Pesquisar" onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar registros" value={search}/></label></header>
        {activeModule === 'Dashboard' && <Dashboard clients={clients.length} equipment={equipment.length} openOrders={openOrders} cashFlow={cashFlow} />}
        {activeModule === 'Clientes' && <ClientsModule addClient={addClient} clients={filteredClients} form={clientForm} remove={(id) => setClients((current) => current.filter((client) => client.id !== id))} setForm={setClientForm} />}
        {activeModule === 'Equipamentos' && <EquipmentModule addEquipment={addEquipment} clients={clients} equipment={filteredEquipment} form={equipmentForm} remove={(id) => setEquipment((current) => current.filter((item) => item.id !== id))} setForm={setEquipmentForm} />}
        {activeModule === 'Ordens de serviço' && <OrdersModule addOrder={addOrder} clients={clients} createQuote={createQuote} equipment={equipment} form={orderForm} orders={orders} setForm={setOrderForm} updateStatus={updateOrderStatus} />}
        {activeModule === 'Orçamentos' && <QuotesModule approveQuote={approveQuote} quotes={quotes} />}
        {activeModule === 'Financeiro' && <FinanceModule cashFlow={cashFlow} finance={finance} />}
      </section>
    </main>
  );
}

function Dashboard({ clients, equipment, openOrders, cashFlow }: { clients: number; equipment: number; openOrders: number; cashFlow: number }) {
  const cards = [{ label: 'Clientes ativos', value: clients, icon: UsersRound }, { label: 'Equipamentos', value: equipment, icon: HardDrive }, { label: 'OS abertas', value: openOrders, icon: Wrench }, { label: 'Fluxo previsto', value: currency.format(cashFlow), icon: BanknoteArrowUp }];
  return <section className="metrics-grid">{cards.map(({ label, value, icon: Icon }) => <article className="metric-card" key={label}><span><Icon size={22}/></span><small>{label}</small><strong>{value}</strong><em>Atualizado</em></article>)}</section>;
}

function ClientsModule(props: { clients: Client[]; form: Omit<Client, 'id'>; setForm: (form: Omit<Client, 'id'>) => void; addClient: (event: FormEvent<HTMLFormElement>) => void; remove: (id: string) => void }) {
  return <Section eyebrow="Etapa 2" title="Cadastro de clientes" actions={<UserRoundPlus/>}><form className="crud-form" onSubmit={props.addClient}>{(['name','document','phone','email','city'] as const).map((field) => <input key={field} placeholder={{name:'Nome',document:'CPF/CNPJ',phone:'Telefone',email:'E-mail',city:'Cidade'}[field]} value={props.form[field]} onChange={(event)=>props.setForm({...props.form,[field]:event.target.value})} required={field==='name'||field==='phone'}/>) }<button type="submit">Salvar cliente</button></form><div className="records-grid">{props.clients.map((client)=><article className="record-card" key={client.id}><strong>{client.name}</strong><span>{client.document}</span><span>{client.phone} · {client.city}</span><button className="danger-button" onClick={()=>props.remove(client.id)} type="button">Excluir</button></article>)}</div></Section>;
}

function EquipmentModule(props: { clients: Client[]; equipment: Equipment[]; form: Omit<Equipment, 'id'>; setForm: (form: Omit<Equipment, 'id'>) => void; addEquipment: (event: FormEvent<HTMLFormElement>) => void; remove: (id: string) => void }) {
  return <Section eyebrow="Etapa 2" title="Cadastro de equipamentos" actions={<HardDrive/>}><form className="crud-form" onSubmit={props.addEquipment}><select value={props.form.clientId} onChange={(event)=>props.setForm({...props.form,clientId:event.target.value})}>{props.clients.map((client)=><option key={client.id} value={client.id}>{client.name}</option>)}</select><select value={props.form.category} onChange={(event)=>props.setForm({...props.form,category:event.target.value as Equipment['category']})}><option>Eletrônico</option><option>Energia solar</option><option>Elétrico</option></select><input placeholder="Marca" value={props.form.brand} onChange={(event)=>props.setForm({...props.form,brand:event.target.value})} required/><input placeholder="Modelo" value={props.form.model} onChange={(event)=>props.setForm({...props.form,model:event.target.value})} required/><input placeholder="Série" value={props.form.serial} onChange={(event)=>props.setForm({...props.form,serial:event.target.value})}/><input placeholder="Observações" value={props.form.notes} onChange={(event)=>props.setForm({...props.form,notes:event.target.value})}/><button type="submit">Salvar equipamento</button></form><div className="records-grid">{props.equipment.map((item)=><article className="record-card" key={item.id}><strong>{item.brand} {item.model}</strong><span>{item.category} · {item.serial}</span><span>{item.notes}</span><button className="danger-button" onClick={()=>props.remove(item.id)} type="button">Excluir</button></article>)}</div></Section>;
}

function OrdersModule(props: { clients: Client[]; equipment: Equipment[]; orders: ServiceOrder[]; form: { clientId: string; equipmentId: string; problem: string; diagnosis: string }; setForm: (form: { clientId: string; equipmentId: string; problem: string; diagnosis: string }) => void; addOrder: (event: FormEvent<HTMLFormElement>) => void; updateStatus: (id: string, status: ServiceStatus) => void; createQuote: (id: string) => void }) {
  return <Section eyebrow="Etapa 3" title="Ordens de serviço"><form className="crud-form" onSubmit={props.addOrder}><select value={props.form.clientId} onChange={(event)=>props.setForm({...props.form,clientId:event.target.value})}>{props.clients.map((client)=><option key={client.id} value={client.id}>{client.name}</option>)}</select><select value={props.form.equipmentId} onChange={(event)=>props.setForm({...props.form,equipmentId:event.target.value})}>{props.equipment.map((item)=><option key={item.id} value={item.id}>{item.brand} {item.model}</option>)}</select><input placeholder="Problema relatado" value={props.form.problem} onChange={(event)=>props.setForm({...props.form,problem:event.target.value})} required/><input placeholder="Diagnóstico inicial" value={props.form.diagnosis} onChange={(event)=>props.setForm({...props.form,diagnosis:event.target.value})}/><button type="submit">Registrar entrada</button></form><div className="order-list">{props.orders.map((order)=><article className="record-card wide" key={order.id}><div><strong>{order.id.toUpperCase()} · {order.status}</strong><span>Entrada: {order.intakeDate} {order.exitDate ? `· Saída: ${order.exitDate}` : ''}</span><p>{order.problem}</p></div><select value={order.status} onChange={(event)=>props.updateStatus(order.id,event.target.value as ServiceStatus)}>{serviceStatuses.map((status)=><option key={status}>{status}</option>)}</select><button onClick={()=>props.createQuote(order.id)} type="button">Gerar orçamento</button><details><summary>Histórico completo</summary>{order.history.map((item)=><p key={`${item.at}-${item.status}`}>{item.at} · {item.status} · {item.note}</p>)}</details></article>)}</div></Section>;
}

function QuotesModule({ quotes, approveQuote }: { quotes: Quote[]; approveQuote: (id: string) => void }) {
  return <Section eyebrow="Etapa 4" title="Orçamentos automáticos" actions={<FileText/>}><div className="records-grid">{quotes.map((quote)=>{ const total = quote.parts + quote.labor - quote.discount; return <article className="record-card" key={quote.id}><strong>{quote.id.toUpperCase()}</strong><span>OS: {quote.serviceOrderId.toUpperCase()}</span><span>Peças {currency.format(quote.parts)} · Mão de obra {currency.format(quote.labor)}</span><strong>Total: {currency.format(total)}</strong><button disabled={quote.approved} onClick={()=>approveQuote(quote.id)} type="button">{quote.approved ? 'Convertido em financeiro' : 'Aprovar e converter'}</button></article>; })}</div></Section>;
}

function FinanceModule({ finance, cashFlow }: { finance: FinanceEntry[]; cashFlow: number }) {
  const receivable = finance.filter((entry)=>entry.type==='Receber').reduce((total, entry)=>total+entry.amount,0);
  const payable = finance.filter((entry)=>entry.type==='Pagar').reduce((total, entry)=>total+entry.amount,0);
  return <Section eyebrow="Etapa 5" title="Financeiro e relatórios" actions={<Activity/>}><div className="metrics-grid"><article className="metric-card"><small>Contas a receber</small><strong>{currency.format(receivable)}</strong></article><article className="metric-card"><small>Contas a pagar</small><strong>{currency.format(payable)}</strong></article><article className="metric-card"><small>Fluxo de caixa</small><strong>{currency.format(cashFlow)}</strong></article></div><div className="records-grid">{finance.map((entry)=><article className="record-card" key={entry.id}><strong>{entry.type}</strong><span>{entry.description}</span><span>{entry.dueDate} · {entry.paid ? 'Pago' : 'Aberto'}</span><strong>{currency.format(entry.amount)}</strong></article>)}</div></Section>;
}

export default App;
