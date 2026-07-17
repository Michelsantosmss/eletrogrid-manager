import { FormEvent, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Activity, BanknoteArrowUp, FileText, HardDrive, LogOut, Pencil, Plus, Search, ShieldCheck, Trash2, UsersRound, Wrench, Zap } from 'lucide-react';
import { Section } from './components/Section';
import { OperationsDashboard } from './components/OperationsDashboard';
import { QuoteDocumentButton } from './components/QuoteDocumentButton';
import { useRealtimeCollection } from './hooks/useRealtimeCollection';
import { auth, firebaseEnabled, loginWithEmail, logout, registerWithEmail, removeRecord, saveRecord, uploadServiceFile } from './services/firebase';
import { clientsSeed, equipmentSeed, financeSeed, orderSeed, quoteSeed } from './services/seedData';
import { Client, Equipment, FinanceEntry, Quote, ServiceOrder, ServiceStatus } from './types';
import './styles.css';

const statuses: ServiceStatus[] = ['Recebido', 'Em análise', 'Aguardando peça', 'Em reparo', 'Finalizado', 'Entregue'];
const modules = ['Dashboard', 'Clientes', 'Equipamentos', 'Ordens de serviço', 'Orçamentos', 'Financeiro'] as const;
type Module = typeof modules[number];
const today = () => new Date().toISOString().slice(0, 10);
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const nextOrderId = (orders: ServiceOrder[]) => {
  const highest = orders.reduce((current, order) => Math.max(current, Number(order.id.match(/(\d+)$/)?.[1] ?? 0)), 0);
  return `os-${String(highest + 1).padStart(6, '0')}`;
};
const equipmentQr = (orderId: string, equipmentId: string) => {
  const value = `ELETROGRID|${orderId.toUpperCase()}|${equipmentId}`;
  return { value, url: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&format=png&data=${encodeURIComponent(value)}` };
};
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const emptyClient = { name: '', document: '', phone: '', email: '', city: '' };

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [demo, setDemo] = useState(false);
  const [userReady, setUserReady] = useState(!firebaseEnabled);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState<Module>('Dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | ServiceStatus>('Todas');
  const [clients, setClients, clientsLive] = useRealtimeCollection<Client>('clients', clientsSeed);
  const [equipment, setEquipment, equipmentLive] = useRealtimeCollection<Equipment>('equipment', equipmentSeed);
  const [orders, setOrders, ordersLive] = useRealtimeCollection<ServiceOrder>('serviceOrders', orderSeed);
  const [quotes, setQuotes] = useRealtimeCollection<Quote>('quotes', quoteSeed);
  const [finance, setFinance] = useRealtimeCollection<FinanceEntry>('finance', financeSeed);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<Omit<Equipment, 'id'>>({ clientId: 'cli-1', category: 'Eletrônico', brand: '', model: '', serial: '', notes: '' });
  const [editingEquipment, setEditingEquipment] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({ clientId: 'cli-1', equipmentId: 'eq-1', problem: '', diagnosis: '' });

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth, (user) => {
      setAuthenticated(Boolean(user));
      setUserReady(true);
    });
  }, []);

  const visibleClients = useMemo(() => clients.filter((item) => match(search, item.name, item.document, item.phone, item.email, item.city)), [clients, search]);
  const visibleEquipment = useMemo(() => equipment.filter((item) => match(search, item.brand, item.model, item.serial, item.category)), [equipment, search]);
  const visibleOrders = useMemo(() => orders.filter((item) => (statusFilter === 'Todas' || item.status === statusFilter) && match(search, item.id, item.problem, item.diagnosis, item.status)), [orders, search, statusFilter]);
  const openOrders = orders.filter((item) => !['Finalizado', 'Entregue'].includes(item.status)).length;
  const cashFlow = finance.reduce((total, item) => total + (item.type === 'Receber' ? item.amount : -item.amount), 0);
  const isAuthenticated = demo || authenticated;

  async function handleAuth(event: FormEvent, mode: 'login' | 'register') {
    event.preventDefault();
    setAuthError('');
    if (!firebaseEnabled) { setAuthError('Configure as variáveis VITE_FIREBASE_* para usar a autenticação.'); return; }
    try {
      if (mode === 'login') await loginWithEmail(email, password);
      else await registerWithEmail(email, password);
    } catch { setAuthError('Não foi possível autenticar. Confira o e-mail, senha e a configuração Firebase.'); }
  }

  async function persist<T extends { id: string }>(path: string, record: T) { if (firebaseEnabled) await saveRecord(path, record); }
  async function destroy(path: string, id: string) { if (firebaseEnabled) await removeRecord(path, id); }

  async function submitClient(event: FormEvent) {
    event.preventDefault();
    const record: Client = { id: editingClient ?? makeId('cli'), ...clientForm };
    setClients((items) => editingClient ? items.map((item) => item.id === record.id ? record : item) : [record, ...items]);
    await persist('clients', record);
    setClientForm(emptyClient); setEditingClient(null);
  }
  async function deleteClient(id: string) { setClients((items) => items.filter((item) => item.id !== id)); await destroy('clients', id); }
  async function submitEquipment(event: FormEvent) {
    event.preventDefault();
    const record: Equipment = { id: editingEquipment ?? makeId('eq'), ...equipmentForm };
    setEquipment((items) => editingEquipment ? items.map((item) => item.id === record.id ? record : item) : [record, ...items]);
    await persist('equipment', record);
    setEquipmentForm({ clientId: clients[0]?.id ?? '', category: 'Eletrônico', brand: '', model: '', serial: '', notes: '' }); setEditingEquipment(null);
  }
  async function deleteEquipment(id: string) { setEquipment((items) => items.filter((item) => item.id !== id)); await destroy('equipment', id); }
  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    const id = nextOrderId(orders);
    const qrCode = equipmentQr(id, orderForm.equipmentId);
    const record: ServiceOrder = { id, ...orderForm, qrCode, status: 'Recebido', intakeDate: today(), history: [{ at: new Date().toLocaleString('pt-BR'), status: 'Recebido', note: `Entrada registrada. Etiqueta QR criada: ${qrCode.value}.` }], documents: [{ name: 'Etiqueta QR do equipamento', url: qrCode.url }] };
    setOrders((items) => [record, ...items]); await persist('serviceOrders', record);
    setOrderForm({ clientId: clients[0]?.id ?? '', equipmentId: equipment[0]?.id ?? '', problem: '', diagnosis: '' });
  }
  async function updateOrder(order: ServiceOrder, changes: Partial<ServiceOrder>, note?: string) {
    const record = { ...order, ...changes, history: note ? [...order.history, { at: new Date().toLocaleString('pt-BR'), status: changes.status ?? order.status, note }] : order.history };
    setOrders((items) => items.map((item) => item.id === record.id ? record : item)); await persist('serviceOrders', record);
  }
  async function attachFile(order: ServiceOrder, file: File) {
    try {
      const url = firebaseEnabled ? await uploadServiceFile(order.id, file) : URL.createObjectURL(file);
      await updateOrder(order, { documents: [...(order.documents ?? []), { name: file.name, url }] }, `Anexo incluído: ${file.name}.`);
    } catch { window.alert('Não foi possível enviar o anexo. Verifique as regras do Firebase Storage.'); }
  }
  async function createQuote(orderId: string) {
    const record: Quote = { id: makeId('orc'), serviceOrderId: orderId, parts: 0, labor: 0, discount: 0, approved: false };
    setQuotes((items) => [record, ...items]); await persist('quotes', record); setActiveModule('Orçamentos');
  }
  async function approveQuote(quote: Quote) {
    const approved = { ...quote, approved: true }; const entry: FinanceEntry = { id: makeId('fin'), type: 'Receber', description: `Orçamento ${quote.id.toUpperCase()}`, amount: quote.parts + quote.labor - quote.discount, dueDate: today(), paid: false };
    setQuotes((items) => items.map((item) => item.id === quote.id ? approved : item)); setFinance((items) => [entry, ...items]); await Promise.all([persist('quotes', approved), persist('finance', entry)]);
  }

  if (!userReady) return <main className="login-screen">Carregando sessão…</main>;
  if (!isAuthenticated) return <main className="login-screen"><form className="login-card" onSubmit={(event) => handleAuth(event, 'login')}><span className="brand-mark"><Zap size={28}/></span><h1>EletroGrid Manager</h1><p>Acesse a operação técnica com sua conta Firebase.</p><input aria-label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="E-mail" required/><input aria-label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" minLength={6} required/>{authError && <strong className="form-error">{authError}</strong>}<button type="submit">Entrar</button><button className="ghost-button" onClick={(e) => handleAuth(e, 'register')} type="button">Criar acesso</button><button className="link-button" onClick={() => setDemo(true)} type="button">Abrir modo demonstração</button></form></main>;

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark"><Zap size={24}/></span><div><strong>EletroGrid</strong><small>Manager</small></div></div><nav>{modules.map((module) => <button className={`nav-button ${activeModule === module ? 'active' : ''}`} key={module} onClick={() => setActiveModule(module)} type="button">{module}</button>)}</nav><button className="logout-button" onClick={() => { setDemo(false); void logout(); }} type="button"><LogOut size={18}/>Sair</button></aside><section className="content"><header className="hero"><div><span className="eyebrow"><ShieldCheck size={16}/>Operação integrada</span><h1>Controle técnico em tempo real.</h1><p>Clientes, equipamentos e ordens de serviço em uma única operação.</p></div><label className="search-box"><Search size={18}/><input aria-label="Pesquisa global" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar em todos os registros"/></label></header>{activeModule === 'Dashboard' && <Dashboard clients={clients.length} equipment={equipment.length} openOrders={openOrders} cashFlow={cashFlow} live={clientsLive && equipmentLive && ordersLive}/>} {activeModule === 'Clientes' && <Clients form={clientForm} items={visibleClients} onDelete={deleteClient} onEdit={(item) => { setEditingClient(item.id); setClientForm(item); }} onSubmit={submitClient} setForm={setClientForm} editing={Boolean(editingClient)}/>} {activeModule === 'Equipamentos' && <EquipmentModule clients={clients} form={equipmentForm} items={visibleEquipment} onDelete={deleteEquipment} onEdit={(item) => { setEditingEquipment(item.id); setEquipmentForm(item); }} onSubmit={submitEquipment} setForm={setEquipmentForm} editing={Boolean(editingEquipment)}/>} {activeModule === 'Ordens de serviço' && <Orders clients={clients} equipment={equipment} form={orderForm} items={visibleOrders} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setForm={setOrderForm} onSubmit={submitOrder} onStatus={(order, status) => updateOrder(order, { status, exitDate: status === 'Entregue' ? today() : order.exitDate }, `Status alterado para ${status}.`)} onAttach={attachFile} onQuote={createQuote}/>} {activeModule === 'Orçamentos' && <Quotes items={quotes} onApprove={approveQuote}/>} {activeModule === 'Financeiro' && <Finance cashFlow={cashFlow} items={finance}/>}</section></main>;
}

const match = (term: string, ...values: string[]) => values.join(' ').toLocaleLowerCase().includes(term.toLocaleLowerCase());
function Dashboard({ clients, equipment, live }: { clients: number; equipment: number; openOrders: number; cashFlow: number; live: boolean }) { return <OperationsDashboard clients={clients} equipment={equipment} live={live}/>; }
function Clients({ items, form, setForm, onSubmit, onEdit, onDelete, editing }: { items: Client[]; form: Omit<Client, 'id'>; setForm: (value: Omit<Client, 'id'>) => void; onSubmit: (e: FormEvent) => void; onEdit: (item: Client) => void; onDelete: (id: string) => void; editing: boolean }) { return <Section eyebrow="Cadastros" title="Clientes" actions={<UsersRound/>}><form className="crud-form" onSubmit={onSubmit}>{(['name', 'document', 'phone', 'email', 'city'] as const).map((key) => <input key={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={{ name: 'Nome', document: 'CPF/CNPJ', phone: 'Telefone', email: 'E-mail', city: 'Cidade' }[key]} required={key === 'name' || key === 'phone'}/>) }<button type="submit">{editing ? 'Atualizar cliente' : 'Salvar cliente'}</button></form><Cards>{items.map((item) => <article className="record-card" key={item.id}><strong>{item.name}</strong><span>{item.document}</span><span>{item.phone} · {item.city}</span><div className="card-actions"><button className="ghost-button" onClick={() => onEdit(item)} type="button"><Pencil size={16}/>Editar</button><button className="danger-button" onClick={() => onDelete(item.id)} type="button"><Trash2 size={16}/>Excluir</button></div></article>)}</Cards></Section>; }
function EquipmentModule({ clients, items, form, setForm, onSubmit, onEdit, onDelete, editing }: { clients: Client[]; items: Equipment[]; form: Omit<Equipment, 'id'>; setForm: (value: Omit<Equipment, 'id'>) => void; onSubmit: (e: FormEvent) => void; onEdit: (item: Equipment) => void; onDelete: (id: string) => void; editing: boolean }) { return <Section eyebrow="Cadastros" title="Equipamentos" actions={<HardDrive/>}><form className="crud-form" onSubmit={onSubmit}><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Equipment['category'] })}>{['Eletrônico', 'Energia solar', 'Elétrico'].map((item) => <option key={item}>{item}</option>)}</select>{(['brand', 'model', 'serial', 'notes'] as const).map((key) => <input key={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={{ brand: 'Marca', model: 'Modelo', serial: 'Número de série', notes: 'Observações' }[key]} required={key === 'brand' || key === 'model'}/>) }<button type="submit">{editing ? 'Atualizar equipamento' : 'Salvar equipamento'}</button></form><Cards>{items.map((item) => <article className="record-card" key={item.id}><strong>{item.brand} {item.model}</strong><span>{item.category} · {item.serial}</span><span>{item.notes}</span><div className="card-actions"><button className="ghost-button" onClick={() => onEdit(item)} type="button"><Pencil size={16}/>Editar</button><button className="danger-button" onClick={() => onDelete(item.id)} type="button"><Trash2 size={16}/>Excluir</button></div></article>)}</Cards></Section>; }
function Orders({ clients, equipment, items, form, setForm, onSubmit, onStatus, onAttach, onQuote, statusFilter, setStatusFilter }: { clients: Client[]; equipment: Equipment[]; items: ServiceOrder[]; form: { clientId: string; equipmentId: string; problem: string; diagnosis: string }; setForm: (value: { clientId: string; equipmentId: string; problem: string; diagnosis: string }) => void; onSubmit: (e: FormEvent) => void; onStatus: (order: ServiceOrder, status: ServiceStatus) => void; onAttach: (order: ServiceOrder, file: File) => void; onQuote: (id: string) => void; statusFilter: 'Todas' | ServiceStatus; setStatusFilter: (value: 'Todas' | ServiceStatus) => void }) { return <Section eyebrow="Operação" title="Ordens de serviço" actions={<Wrench/>}><div className="filter-group"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'Todas' | ServiceStatus)}><option>Todas</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div><form className="crud-form" onSubmit={onSubmit}><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={form.equipmentId} onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}>{equipment.map((item) => <option key={item.id} value={item.id}>{item.brand} {item.model}</option>)}</select><input value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Problema relatado" required/><input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Diagnóstico inicial"/><button type="submit"><Plus size={16}/>Registrar entrada</button></form><div className="order-list">{items.map((item) => <article className="record-card wide" key={item.id}><div><strong>{item.id.toUpperCase()} · {item.status}</strong><span>Entrada: {item.intakeDate}{item.exitDate ? ` · Saída: ${item.exitDate}` : ''}</span><p>{item.problem}</p></div><select value={item.status} onChange={(e) => onStatus(item, e.target.value as ServiceStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button onClick={() => onQuote(item.id)} type="button"><FileText size={16}/>Orçamento</button><label className="file-button">Anexar arquivo<input aria-label={`Anexar arquivo ${item.id}`} type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) onAttach(item, file); }}/></label>{item.documents?.length ? <div className="document-list">{item.documents.map((doc) => <a href={doc.url} key={`${item.id}-${doc.name}`} rel="noreferrer" target="_blank">{doc.name}</a>)}</div> : null}<details><summary>Histórico completo</summary>{item.history.map((entry, index) => <p key={`${entry.at}-${index}`}>{entry.at} · {entry.status} · {entry.note}</p>)}</details></article>)}</div></Section>; }
function Quotes({ items, onApprove }: { items: Quote[]; onApprove: (quote: Quote) => void }) { return <Section eyebrow="Financeiro" title="Orçamentos" actions={<FileText/>}><Cards>{items.map((item) => { const total = item.parts + item.labor - item.discount; return <article className="record-card" key={item.id}><strong>{item.id.toUpperCase()}</strong><span>OS: {item.serviceOrderId.toUpperCase()}</span><span>Peças {money.format(item.parts)} · Mão de obra {money.format(item.labor)}</span><strong>Total: {money.format(total)}</strong><div className="card-actions"><QuoteDocumentButton quote={item}/><button disabled={item.approved} onClick={() => onApprove(item)} type="button">{item.approved ? 'Aprovado' : 'Aprovar e lançar'}</button></div></article>; })}</Cards></Section>; }
function Finance({ items, cashFlow }: { items: FinanceEntry[]; cashFlow: number }) { return <Section eyebrow="Financeiro" title="Contas e fluxo de caixa" actions={<Activity/>}><div className="metrics-grid"><article className="metric-card"><small>Receber</small><strong>{money.format(items.filter((item) => item.type === 'Receber').reduce((sum, item) => sum + item.amount, 0))}</strong></article><article className="metric-card"><small>Pagar</small><strong>{money.format(items.filter((item) => item.type === 'Pagar').reduce((sum, item) => sum + item.amount, 0))}</strong></article><article className="metric-card"><small>Fluxo</small><strong>{money.format(cashFlow)}</strong></article></div><Cards>{items.map((item) => <article className="record-card" key={item.id}><strong>{item.type}</strong><span>{item.description}</span><span>{item.dueDate} · {item.paid ? 'Pago' : 'Aberto'}</span><strong>{money.format(item.amount)}</strong></article>)}</Cards></Section>; }
function Cards({ children }: { children: React.ReactNode }) { return <div className="records-grid">{children}</div>; }
export default App;
