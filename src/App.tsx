import { FormEvent, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Activity, BanknoteArrowUp, FileText, HardDrive, LogOut, Pencil, Plus, Search, ShieldCheck, Trash2, UsersRound, Wrench } from 'lucide-react';
import { EletroGridMark } from './components/EletroGridMark';
import { Section } from './components/Section';
import { OperationsDashboard } from './components/OperationsDashboard';
import { QuoteDocumentButton } from './components/QuoteDocumentButton';
import { OrderDocumentButton } from './components/OrderDocumentButton';
import { ServiceNoteButton } from './components/ServiceNoteButton';
import { useRealtimeCollection } from './hooks/useRealtimeCollection';
import { auth, firebaseEnabled, loginWithEmail, logout, registerWithEmail, removeRecord, resetPassword, saveRecord, uploadServiceFile } from './services/firebase';
import { clientsSeed, equipmentSeed, financeSeed, orderSeed, quoteSeed } from './services/seedData';
import { Client, Equipment, FinanceEntry, Quote, ServiceOrder, ServiceStatus } from './types';
import { quoteItems, quoteSubtotal, quoteTotal } from './services/quoteDocument';
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

export function resolveOrderRelations(order: ServiceOrder | undefined, clients: Client[], equipment: Equipment[]) {
  if (!order) return { client: undefined, equipment: undefined };
  const directClient = clients.find((entry) => entry.id === order.clientId);
  const linkedEquipment = equipment.find((entry) => entry.id === order.equipmentId);
  const compatibleEquipment = directClient ? equipment.filter((entry) => entry.clientId === directClient.id) : equipment;
  const asset = linkedEquipment ?? (compatibleEquipment.length === 1 ? compatibleEquipment[0] : undefined);
  const client = directClient
    ?? clients.find((entry) => entry.id === asset?.clientId)
    ?? (clients.length === 1 ? clients[0] : undefined);
  return { client, equipment: asset };
}

export function equipmentForClient(clientId: string, clients: Client[], equipment: Equipment[]) {
  const linked = equipment.filter((item) => item.clientId === clientId);
  if (linked.length) return linked;
  if (clients.length === 1 && clients[0]?.id === clientId) {
    return equipment.filter((item) => !clients.some((client) => client.id === item.clientId));
  }
  return [];
}

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [demo, setDemo] = useState(false);
  const [userReady, setUserReady] = useState(!firebaseEnabled);
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<Module>('Dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | ServiceStatus>('Todas');
  const cloudEnabled = Boolean(userId) && !demo;
  const [clients, setClients, clientsLive] = useRealtimeCollection<Client>('clients', clientsSeed, cloudEnabled);
  const [equipment, setEquipment, equipmentLive] = useRealtimeCollection<Equipment>('equipment', equipmentSeed, cloudEnabled);
  const [orders, setOrders, ordersLive] = useRealtimeCollection<ServiceOrder>('serviceOrders', orderSeed, cloudEnabled);
  const [quotes, setQuotes] = useRealtimeCollection<Quote>('quotes', quoteSeed, cloudEnabled);
  const [finance, setFinance] = useRealtimeCollection<FinanceEntry>('finance', financeSeed, cloudEnabled);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<Omit<Equipment, 'id'>>({ clientId: 'cli-1', category: 'Eletrônico', brand: '', model: '', serial: '', color: '', voltage: '', accessories: '', condition: '', notes: '' });
  const [editingEquipment, setEditingEquipment] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({ clientId: 'cli-1', equipmentId: 'eq-1', problem: '', diagnosis: '' });
  const [quoteDraft, setQuoteDraft] = useState<Quote | null>(null);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth, (user) => {
      setAuthenticated(Boolean(user));
      setUserId(user?.uid ?? null);
      setUserReady(true);
    });
  }, []);

  useEffect(() => {
    if (!clients.length) return;
    setOrderForm((current) => {
      const clientId = clients.some((client) => client.id === current.clientId) ? current.clientId : clients[0].id;
      const available = equipmentForClient(clientId, clients, equipment);
      const equipmentId = available.some((item) => item.id === current.equipmentId) ? current.equipmentId : (available[0]?.id ?? '');
      return clientId === current.clientId && equipmentId === current.equipmentId ? current : { ...current, clientId, equipmentId };
    });
    setEquipmentForm((current) => clients.some((client) => client.id === current.clientId) ? current : { ...current, clientId: clients[0].id });
  }, [clients, equipment]);

  const visibleClients = useMemo(() => clients.filter((item) => match(search, item.name, item.document, item.phone, item.email, item.city)), [clients, search]);
  const visibleEquipment = useMemo(() => equipment.filter((item) => match(search, item.brand, item.model, item.serial, item.category, item.color ?? '', item.accessories ?? '', item.condition ?? '')), [equipment, search]);
  const visibleOrders = useMemo(() => orders.filter((item) => (statusFilter === 'Todas' || item.status === statusFilter) && match(search, item.id, item.problem, item.diagnosis, item.status)), [orders, search, statusFilter]);
  const openOrders = orders.filter((item) => !['Finalizado', 'Entregue'].includes(item.status)).length;
  const cashFlow = finance.reduce((total, item) => total + (item.type === 'Receber' ? item.amount : -item.amount), 0);
  const isAuthenticated = demo || authenticated;

  async function handleAuth(event: FormEvent, mode: 'login' | 'register') {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (!firebaseEnabled) { setAuthError('Configure as variáveis VITE_FIREBASE_* para usar a autenticação.'); return; }
    try {
      if (mode === 'login') await loginWithEmail(email, password);
      else await registerWithEmail(email, password);
    } catch { setAuthError('Não foi possível autenticar. Confira o e-mail, senha e a configuração Firebase.'); }
  }

  async function handlePasswordReset() {
    setAuthError('');
    setAuthMessage('');
    const normalizedEmail = email.trim();
    if (!normalizedEmail) { setAuthError('Digite seu e-mail para redefinir a senha.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) { setAuthError('Digite um e-mail válido.'); return; }
    if (!firebaseEnabled) { setAuthError('A recuperação de senha não está disponível no modo demonstração.'); return; }
    try {
      await resetPassword(normalizedEmail);
      setAuthMessage('Enviamos o link de redefinição. Verifique sua caixa de entrada e a pasta de spam.');
    } catch {
      setAuthError('Não foi possível enviar o e-mail de redefinição. Tente novamente em alguns minutos.');
    }
  }

  async function persist<T extends { id: string }>(path: string, record: T) {
    if (demo) return;
    if (!cloudEnabled) throw new Error('Aguarde a conexão com a nuvem e tente novamente.');
    await saveRecord(path, record);
  }
  async function destroy(path: string, id: string) {
    if (demo) return;
    if (!cloudEnabled) throw new Error('Aguarde a conexão com a nuvem e tente novamente.');
    await removeRecord(path, id);
  }
  const cloudError = () => window.alert('Não foi possível salvar na nuvem. Verifique a internet, aguarde a sincronização e tente novamente.');

  async function submitClient(event: FormEvent) {
    event.preventDefault();
    const record: Client = { id: editingClient ?? makeId('cli'), ...clientForm };
    try { await persist('clients', record); } catch { cloudError(); return; }
    setClients((items) => editingClient ? items.map((item) => item.id === record.id ? record : item) : [record, ...items]);
    setClientForm(emptyClient); setEditingClient(null);
  }
  async function deleteClient(id: string) { try { await destroy('clients', id); setClients((items) => items.filter((item) => item.id !== id)); } catch { cloudError(); } }
  async function submitEquipment(event: FormEvent) {
    event.preventDefault();
    const clientId = clients.some((client) => client.id === equipmentForm.clientId) ? equipmentForm.clientId : (clients[0]?.id ?? '');
    if (!clientId) return;
    const record: Equipment = { id: editingEquipment ?? makeId('eq'), ...equipmentForm, clientId };
    try { await persist('equipment', record); } catch { cloudError(); return; }
    setEquipment((items) => editingEquipment ? items.map((item) => item.id === record.id ? record : item) : [record, ...items]);
    setEquipmentForm({ clientId: clients[0]?.id ?? '', category: 'Eletrônico', brand: '', model: '', serial: '', color: '', voltage: '', accessories: '', condition: '', notes: '' }); setEditingEquipment(null);
  }
  async function deleteEquipment(id: string) { try { await destroy('equipment', id); setEquipment((items) => items.filter((item) => item.id !== id)); } catch { cloudError(); } }
  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    const selectedEquipment = equipmentForClient(orderForm.clientId, clients, equipment).find((item) => item.id === orderForm.equipmentId);
    if (!selectedEquipment) return;
    const id = nextOrderId(orders);
    const qrCode = equipmentQr(id, selectedEquipment.id);
    const record: ServiceOrder = { id, ...orderForm, equipmentId: selectedEquipment.id, qrCode, status: 'Recebido', intakeDate: today(), history: [{ at: new Date().toLocaleString('pt-BR'), status: 'Recebido', note: `Entrada registrada. Etiqueta QR criada: ${qrCode.value}.` }], documents: [{ name: 'Etiqueta QR do equipamento', url: qrCode.url }] };
    try { await persist('serviceOrders', record); } catch { cloudError(); return; }
    setOrders((items) => [record, ...items]);
    setOrderForm({ clientId: clients[0]?.id ?? '', equipmentId: equipment[0]?.id ?? '', problem: '', diagnosis: '' });
  }
  async function updateOrder(order: ServiceOrder, changes: Partial<ServiceOrder>, note?: string) {
    const record = { ...order, ...changes, history: note ? [...order.history, { at: new Date().toLocaleString('pt-BR'), status: changes.status ?? order.status, note }] : order.history };
    setOrders((items) => items.map((item) => item.id === record.id ? record : item));
    try { await persist('serviceOrders', record); } catch { setOrders((items) => items.map((item) => item.id === order.id ? order : item)); cloudError(); }
  }
  async function attachFile(order: ServiceOrder, file: File) {
    try {
      const url = firebaseEnabled && !demo ? await uploadServiceFile(order.id, file) : URL.createObjectURL(file);
      await updateOrder(order, { documents: [...(order.documents ?? []), { name: file.name, url }] }, `Anexo incluído: ${file.name}.`);
    } catch (error) {
      const detail = error instanceof Error ? ` ${error.message}` : '';
      window.alert(`Não foi possível enviar o anexo. Verifique o acesso ao Supabase Storage e tente novamente.${detail}`);
    }
  }
  async function createQuote(orderId: string) {
    const existing = quotes.find((quote) => quote.serviceOrderId === orderId && !quote.approved);
    setQuoteDraft(existing ? { ...existing, items: quoteItems(existing), deadline: existing.deadline || '5 dias úteis', warranty: existing.warranty || '90 dias sobre o serviço executado', notes: existing.notes || '' } : { id: makeId('orc'), serviceOrderId: orderId, items: [{ id: makeId('item'), description: '', kind: 'Serviço', quantity: 1, unitPrice: 0 }], discount: 0, deadline: '5 dias úteis', warranty: '90 dias sobre o serviço executado', notes: '', approved: false });
    setActiveModule('Orçamentos');
  }
  async function saveQuote(event: FormEvent) {
    event.preventDefault();
    if (!quoteDraft) return;
    const exists = quotes.some((quote) => quote.id === quoteDraft.id);
    try { await persist('quotes', quoteDraft); } catch { cloudError(); return; }
    setQuotes((items) => exists ? items.map((quote) => quote.id === quoteDraft.id ? quoteDraft : quote) : [quoteDraft, ...items]);
    const linkedOrder = orders.find((order) => order.id === quoteDraft.serviceOrderId);
    if (linkedOrder) await updateOrder(linkedOrder, { serviceValue: quoteTotal(quoteDraft) }, `Valor do serviço atualizado pelo orçamento ${quoteDraft.id.toUpperCase()}.`);
    setQuoteDraft(null);
  }
  async function approveQuote(quote: Quote) {
    const approved = { ...quote, approved: true }; const entry: FinanceEntry = { id: makeId('fin'), type: 'Receber', description: `Orçamento ${quote.id.toUpperCase()}`, amount: quoteTotal(quote), dueDate: today(), paid: false };
    try { await Promise.all([persist('quotes', approved), persist('finance', entry)]); } catch { cloudError(); return; }
    setQuotes((items) => items.map((item) => item.id === quote.id ? approved : item)); setFinance((items) => [entry, ...items]);
  }

  if (!userReady) return <main className="login-screen">Carregando sessão…</main>;
  if (!isAuthenticated) return <main className="login-screen"><form className="login-card" onSubmit={(event) => handleAuth(event, 'login')}><EletroGridMark/><h1>EletroGrid Manager</h1><p>Acesse a operação técnica com sua conta Firebase.</p><input aria-label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="E-mail" required/><input aria-label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" minLength={6} required/>{authError && <strong className="form-error" role="alert">{authError}</strong>}{authMessage && <strong className="form-success" role="status">{authMessage}</strong>}<button type="submit">Entrar</button><button className="ghost-button" onClick={(e) => handleAuth(e, 'register')} type="button">Criar acesso</button><button className="password-reset-button" onClick={() => void handlePasswordReset()} type="button">Esqueci minha senha</button><button className="link-button" onClick={() => setDemo(true)} type="button">Abrir modo demonstração</button></form></main>;

  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><EletroGridMark/><div><strong>EletroGrid</strong><small>Manager</small></div></div><nav>{modules.map((module) => <button className={`nav-button ${activeModule === module ? 'active' : ''}`} key={module} onClick={() => setActiveModule(module)} type="button">{module}</button>)}</nav><button className="logout-button" onClick={() => { setDemo(false); void logout(); }} type="button"><LogOut size={18}/>Sair</button></aside>
    <section className="content">
      <header className="hero"><div><span className="eyebrow"><ShieldCheck size={16}/>Operação integrada</span><h1>Controle técnico em tempo real.</h1><p>Clientes, equipamentos e ordens de serviço em uma única operação.</p></div><label className="search-box"><Search size={18}/><input aria-label="Pesquisa global" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar em todos os registros"/></label></header>
      {activeModule === 'Dashboard' && <Dashboard clients={clients.length} equipment={equipment.length} openOrders={openOrders} cashFlow={cashFlow} live={clientsLive && equipmentLive && ordersLive}/>}
      {activeModule === 'Clientes' && <Clients form={clientForm} items={visibleClients} onDelete={deleteClient} onEdit={(item) => { setEditingClient(item.id); setClientForm(item); }} onSubmit={submitClient} setForm={setClientForm} editing={Boolean(editingClient)}/>}
      {activeModule === 'Equipamentos' && <EquipmentModule clients={clients} form={equipmentForm} items={visibleEquipment} onDelete={deleteEquipment} onEdit={(item) => { setEditingEquipment(item.id); setEquipmentForm(item); }} onSubmit={submitEquipment} setForm={setEquipmentForm} editing={Boolean(editingEquipment)}/>}
      {activeModule === 'Ordens de serviço' && <Orders clients={clients} equipment={equipment} quotes={quotes} form={orderForm} items={visibleOrders} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setForm={setOrderForm} onSubmit={submitOrder} onStatus={(order, status) => updateOrder(order, { status, exitDate: status === 'Entregue' ? today() : order.exitDate }, `Status alterado para ${status}.`)} onUpdate={updateOrder} onAttach={attachFile} onQuote={createQuote}/>}
      {activeModule === 'Orçamentos' && <Quotes clients={clients} equipment={equipment} orders={orders} draft={quoteDraft} items={quotes} onApprove={approveQuote} onCancel={() => setQuoteDraft(null)} onSave={saveQuote} setDraft={setQuoteDraft}/>}
      {activeModule === 'Financeiro' && <Finance cashFlow={cashFlow} items={finance}/>}
    </section>
  </main>;
}

const match = (term: string, ...values: string[]) => values.join(' ').toLocaleLowerCase().includes(term.toLocaleLowerCase());
function Dashboard({ clients, equipment, live }: { clients: number; equipment: number; openOrders: number; cashFlow: number; live: boolean }) { return <OperationsDashboard clients={clients} equipment={equipment} live={live}/>; }
function Clients({ items, form, setForm, onSubmit, onEdit, onDelete, editing }: { items: Client[]; form: Omit<Client, 'id'>; setForm: (value: Omit<Client, 'id'>) => void; onSubmit: (e: FormEvent) => void; onEdit: (item: Client) => void; onDelete: (id: string) => void; editing: boolean }) { return <Section eyebrow="Cadastros" title="Clientes" actions={<UsersRound/>}><form className="crud-form" onSubmit={onSubmit}>{(['name', 'document', 'phone', 'email', 'city'] as const).map((key) => <input key={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={{ name: 'Nome', document: 'CPF/CNPJ', phone: 'Telefone', email: 'E-mail', city: 'Cidade' }[key]} required={key === 'name' || key === 'phone'}/>) }<button type="submit">{editing ? 'Atualizar cliente' : 'Salvar cliente'}</button></form><Cards>{items.map((item) => <article className="record-card" key={item.id}><strong>{item.name}</strong><span>{item.document}</span><span>{item.phone} · {item.city}</span><div className="card-actions"><button className="ghost-button" onClick={() => onEdit(item)} type="button"><Pencil size={16}/>Editar</button><button className="danger-button" onClick={() => onDelete(item.id)} type="button"><Trash2 size={16}/>Excluir</button></div></article>)}</Cards></Section>; }
function EquipmentModule({ clients, items, form, setForm, onSubmit, onEdit, onDelete, editing }: { clients: Client[]; items: Equipment[]; form: Omit<Equipment, 'id'>; setForm: (value: Omit<Equipment, 'id'>) => void; onSubmit: (e: FormEvent) => void; onEdit: (item: Equipment) => void; onDelete: (id: string) => void; editing: boolean }) { return <Section eyebrow="Cadastros" title="Equipamentos" actions={<HardDrive/>}><p className="intake-help">Registre a identificação e as condições do aparelho no momento da entrada.</p><form className="crud-form equipment-form" onSubmit={onSubmit}><select aria-label="Cliente do equipamento" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Categoria do serviço" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Equipment['category'] })}>{['Eletrônico', 'Elétrico', 'Energia solar', 'Instalação de ar-condicionado split'].map((item) => <option key={item}>{item}</option>)}</select>{(['brand', 'model', 'serial', 'color', 'voltage', 'accessories', 'condition', 'notes'] as const).map((key) => <input key={key} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={{ brand: 'Marca', model: 'Modelo', serial: 'Número de série / IMEI', color: 'Cor', voltage: 'Tensão (ex.: 220 V)', accessories: 'Acessórios recebidos', condition: 'Estado na entrada', notes: 'Observações de entrada' }[key]} required={key === 'brand' || key === 'model' || key === 'serial' || key === 'condition'}/>) }<button type="submit" disabled={!clients.length}>{editing ? 'Atualizar equipamento' : 'Salvar equipamento'}</button></form><Cards>{items.map((item) => <article className="record-card" key={item.id}><strong>{item.brand} {item.model}</strong><span>{item.category} · Série/IMEI: {item.serial}</span><span>Entrada: {item.condition ?? 'Não informada'}{item.color ? ` · ${item.color}` : ''}</span><span>Acessórios: {item.accessories || 'Não informados'}</span><span>{item.notes}</span><div className="card-actions"><button className="ghost-button" onClick={() => onEdit(item)} type="button"><Pencil size={16}/>Editar</button><button className="danger-button" onClick={() => onDelete(item.id)} type="button"><Trash2 size={16}/>Excluir</button></div></article>)}</Cards></Section>; }
function Orders({ clients, equipment, quotes, items, form, setForm, onSubmit, onStatus, onUpdate, onAttach, onQuote, statusFilter, setStatusFilter }: { clients: Client[]; equipment: Equipment[]; quotes: Quote[]; items: ServiceOrder[]; form: { clientId: string; equipmentId: string; problem: string; diagnosis: string }; setForm: (value: { clientId: string; equipmentId: string; problem: string; diagnosis: string }) => void; onSubmit: (e: FormEvent) => void; onStatus: (order: ServiceOrder, status: ServiceStatus) => void; onUpdate: (order: ServiceOrder, changes: Partial<ServiceOrder>, note?: string) => void; onAttach: (order: ServiceOrder, file: File) => void; onQuote: (id: string) => void; statusFilter: 'Todas' | ServiceStatus; setStatusFilter: (value: 'Todas' | ServiceStatus) => void }) {
  const availableEquipment = equipmentForClient(form.clientId, clients, equipment);
  return <Section eyebrow="Operação" title="Ordens de serviço" actions={<Wrench/>}>
    <div className="filter-group"><select aria-label="Filtrar ordens por status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'Todas' | ServiceStatus)}><option>Todas</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div>
    <form className="crud-form" onSubmit={onSubmit}><select aria-label="Cliente da nova OS" value={form.clientId} onChange={(e) => { const clientId = e.target.value; setForm({ ...form, clientId, equipmentId: equipmentForClient(clientId, clients, equipment)[0]?.id ?? '' }); }}>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Equipamento da nova OS" value={form.equipmentId} onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}>{availableEquipment.map((item) => <option key={item.id} value={item.id}>{item.brand} {item.model}</option>)}</select>{!availableEquipment.length && <span className="form-error">Cadastre ou vincule um equipamento a este cliente.</span>}<input value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Problema relatado" required/><input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Diagnóstico inicial"/><button type="submit" disabled={!form.clientId || !form.equipmentId}><Plus size={16}/>Gerar OS automaticamente</button></form>
    <div className="order-list">{items.map((item) => { const { client, equipment: asset } = resolveOrderRelations(item, clients, equipment); const linkedQuote = quotes.find((quote) => quote.serviceOrderId === item.id); const serviceValue = item.serviceValue ?? (linkedQuote ? quoteTotal(linkedQuote) : 0); const noteOrder = { ...item, serviceValue }; return <article className="record-card order-card" key={item.id}><div className="order-summary-line"><div><strong>{item.id.toUpperCase()} · {item.status}</strong><span>Entrada: {item.intakeDate}{item.exitDate ? ` · Saída: ${item.exitDate}` : ''}</span><p>{item.problem}</p></div><select aria-label={`Status ${item.id}`} value={item.status} onChange={(e) => onStatus(item, e.target.value as ServiceStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div><div className="service-details"><textarea aria-label={`Serviços executados ${item.id}`} value={item.servicePerformed ?? ''} onChange={(e) => onUpdate(item, { servicePerformed: e.target.value }, 'Serviços executados atualizados.')} placeholder="Serviços executados"/><input aria-label={`Garantia ${item.id}`} value={item.warranty ?? ''} onChange={(e) => onUpdate(item, { warranty: e.target.value }, 'Garantia atualizada.')} placeholder="Garantia do serviço"/><label className="service-value-field"><span>Valor do serviço (R$) *</span><input aria-label={`Valor do serviço ${item.id}`} min="0.01" step="0.01" type="number" value={serviceValue || ""} onChange={(e) => onUpdate(item, { serviceValue: Number(e.target.value) || 0 }, "Valor do serviço alterado manualmente.")} required/></label><textarea aria-label={`Observações técnicas ${item.id}`} value={item.technicianNotes ?? ''} onChange={(e) => onUpdate(item, { technicianNotes: e.target.value }, 'Observações técnicas atualizadas.')} placeholder="Observações técnicas"/></div><div className="card-actions"><OrderDocumentButton client={client} equipment={asset} order={item}/><button onClick={() => onQuote(item.id)} type="button"><FileText size={16}/>Criar orçamento</button><ServiceNoteButton client={client} equipment={asset} order={noteOrder}/><label className="file-button">Anexar arquivo<input aria-label={`Anexar arquivo ${item.id}`} type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) onAttach(item, file); }}/></label></div>{item.documents?.length ? <div className="document-list">{item.documents.map((doc) => <a href={doc.url} key={`${item.id}-${doc.name}`} rel="noreferrer" target="_blank">{doc.name}</a>)}</div> : null}<details><summary>Histórico completo</summary>{item.history.map((entry, index) => <p key={`${entry.at}-${index}`}>{entry.at} · {entry.status} · {entry.note}</p>)}</details></article>; })}</div>
  </Section>;
}

function Quotes({ clients, equipment, orders, draft, items, setDraft, onSave, onCancel, onApprove }: { clients: Client[]; equipment: Equipment[]; orders: ServiceOrder[]; draft: Quote | null; items: Quote[]; setDraft: (quote: Quote | null) => void; onSave: (event: FormEvent) => void; onCancel: () => void; onApprove: (quote: Quote) => void }) {
  const updateItem = (id: string, changes: Partial<Quote['items'][number]>) => draft && setDraft({ ...draft, items: draft.items.map((item) => item.id === id ? { ...item, ...changes } : item) });
  return <Section eyebrow="Financeiro" title="Orçamentos" actions={<FileText/>}>
    {draft && <form className="quote-form" onSubmit={onSave}><div className="quote-form-heading"><div><strong>Novo orçamento</strong><span>Vinculado à {draft.serviceOrderId.toUpperCase()}</span></div><button className="ghost-button" onClick={onCancel} type="button">Cancelar</button></div>{draft.items.map((item) => <div className="quote-item-row" key={item.id}><input aria-label="Descrição do item" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} placeholder="Descrição do serviço, peça ou material" required/><select aria-label="Tipo do item" value={item.kind} onChange={(e) => updateItem(item.id, { kind: e.target.value as typeof item.kind })}><option>Serviço</option><option>Peça/material</option></select><input aria-label="Quantidade" min="0.01" step="0.01" type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}/><input aria-label="Valor unitário" min="0" step="0.01" type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })}/><button className="danger-button" disabled={draft.items.length === 1} onClick={() => setDraft({ ...draft, items: draft.items.filter((entry) => entry.id !== item.id) })} type="button">Remover</button></div>)}<button className="ghost-button" onClick={() => setDraft({ ...draft, items: [...draft.items, { id: makeId('item'), description: '', kind: 'Serviço', quantity: 1, unitPrice: 0 }] })} type="button"><Plus size={16}/>Adicionar item</button><div className="quote-conditions"><input aria-label="Desconto" min="0" step="0.01" type="number" value={draft.discount} onChange={(e) => setDraft({ ...draft, discount: Number(e.target.value) || 0 })} placeholder="Desconto"/><input aria-label="Prazo de execução" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} placeholder="Prazo de execução"/><input aria-label="Garantia do orçamento" value={draft.warranty} onChange={(e) => setDraft({ ...draft, warranty: e.target.value })} placeholder="Garantia"/><textarea aria-label="Condições e observações" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Condições e observações"/></div><div className="quote-summary"><span>Subtotal: {money.format(quoteSubtotal(draft))}</span><span>Desconto: {money.format(draft.discount)}</span><strong className="quote-total">TOTAL: {money.format(quoteTotal(draft))}</strong></div><button type="submit">Salvar orçamento</button></form>}
    <Cards>{items.map((item) => { const order = orders.find((entry) => entry.id === item.serviceOrderId); const { client, equipment: asset } = resolveOrderRelations(order, clients, equipment); return <article className="record-card" key={item.id}><strong>{item.id.toUpperCase()}</strong><span>OS: {item.serviceOrderId.toUpperCase()}</span>{client && <span>Cliente: {client.name}</span>}{quoteItems(item).map((entry) => <span key={entry.id}>{entry.quantity}× {entry.description || entry.kind} · {money.format(entry.unitPrice)}</span>)}<strong>Total: {money.format(quoteTotal(item))}</strong><div className="card-actions"><QuoteDocumentButton quote={item} order={order} client={client} equipment={asset}/><button disabled={item.approved} onClick={() => onApprove(item)} type="button">{item.approved ? 'Aprovado' : 'Aprovar e lançar'}</button></div></article>; })}</Cards>
  </Section>;
}
function Finance({ items, cashFlow }: { items: FinanceEntry[]; cashFlow: number }) { return <Section eyebrow="Financeiro" title="Contas e fluxo de caixa" actions={<Activity/>}><div className="metrics-grid"><article className="metric-card"><small>Receber</small><strong>{money.format(items.filter((item) => item.type === 'Receber').reduce((sum, item) => sum + item.amount, 0))}</strong></article><article className="metric-card"><small>Pagar</small><strong>{money.format(items.filter((item) => item.type === 'Pagar').reduce((sum, item) => sum + item.amount, 0))}</strong></article><article className="metric-card"><small>Fluxo</small><strong>{money.format(cashFlow)}</strong></article></div><Cards>{items.map((item) => <article className="record-card" key={item.id}><strong>{item.type}</strong><span>{item.description}</span><span>{item.dueDate} · {item.paid ? 'Pago' : 'Aberto'}</span><strong>{money.format(item.amount)}</strong></article>)}</Cards></Section>; }
function Cards({ children }: { children: React.ReactNode }) { return <div className="records-grid">{children}</div>; }
export default App;
