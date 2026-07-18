import { firebaseEnabled, saveRecord, subscribeToCollection } from './firebase';
import type { ServiceOrder, ServiceStatus } from '../types';

type WorkflowOrder = ServiceOrder & {
  serviceAuthorized?: boolean;
  authorizationAt?: string;
  authorizationMethod?: string;
  authorizationNote?: string;
};

const statuses: ServiceStatus[] = ['Recebido', 'Em análise', 'Aguardando peça', 'Em reparo', 'Finalizado', 'Entregue'];
let orders = new Map<string, WorkflowOrder>();

const normalizeId = (value: string) => value.trim().toLowerCase();

function orderIdFromCard(card: HTMLElement) {
  const text = card.querySelector('strong')?.textContent ?? '';
  return normalizeId(text.split('·')[0] ?? '');
}

function renderWorkflow(card: HTMLElement, order: WorkflowOrder) {
  if (card.querySelector('[data-status-workflow]')) return;
  const details = card.querySelector('details');
  const panel = document.createElement('section');
  panel.className = 'status-workflow';
  panel.dataset.statusWorkflow = 'true';
  panel.innerHTML = `
    <div class="status-workflow-heading">
      <div><span>Movimentação da OS</span><strong>Status e autorização</strong></div>
      <em class="status-chip">${order.status}</em>
    </div>
    <div class="status-workflow-grid">
      <label>Novo status
        <select data-next-status>${statuses.map((status) => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select>
      </label>
      <label>Observação da mudança
        <input data-status-note placeholder="Ex.: cliente autorizou por WhatsApp; peça solicitada...">
      </label>
      <label class="authorization-check"><input type="checkbox" data-authorized ${order.serviceAuthorized ? 'checked' : ''}> Cliente autorizou a execução do serviço</label>
      <label>Forma da autorização
        <select data-authorization-method>
          ${['WhatsApp', 'Telefone', 'Presencial', 'E-mail', 'Outro'].map((method) => `<option ${method === order.authorizationMethod ? 'selected' : ''}>${method}</option>`).join('')}
        </select>
      </label>
      <label class="wide">Detalhes da autorização
        <input data-authorization-note value="${order.authorizationNote ?? ''}" placeholder="Nome de quem autorizou e condições combinadas">
      </label>
    </div>
    <div class="status-workflow-actions">
      <span data-workflow-feedback></span>
      <button type="button" data-save-workflow>Salvar movimentação</button>
    </div>`;
  if (details) card.insertBefore(panel, details);
  else card.appendChild(panel);

  const noteButton = [...card.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('nota'));
  if (noteButton) {
    noteButton.textContent = 'Gerar nota de serviço';
    const allowed = Boolean(order.serviceAuthorized) && ['Finalizado', 'Entregue'].includes(order.status);
    noteButton.disabled = !allowed;
    noteButton.title = allowed ? 'Gerar nota de serviço' : 'Autorize o serviço e marque a OS como Finalizado para liberar a nota';
    noteButton.classList.toggle('note-ready', allowed);
  }

  panel.querySelector<HTMLButtonElement>('[data-save-workflow]')?.addEventListener('click', async () => {
    const nextStatus = (panel.querySelector<HTMLSelectElement>('[data-next-status]')?.value ?? order.status) as ServiceStatus;
    const statusNote = panel.querySelector<HTMLInputElement>('[data-status-note]')?.value.trim() ?? '';
    const authorized = panel.querySelector<HTMLInputElement>('[data-authorized]')?.checked ?? false;
    const authorizationMethod = panel.querySelector<HTMLSelectElement>('[data-authorization-method]')?.value ?? '';
    const authorizationNote = panel.querySelector<HTMLInputElement>('[data-authorization-note]')?.value.trim() ?? '';
    const now = new Date().toLocaleString('pt-BR');
    const notes = [
      statusNote || `Status alterado para ${nextStatus}.`,
      authorized && !order.serviceAuthorized ? `Serviço autorizado via ${authorizationMethod}${authorizationNote ? `: ${authorizationNote}` : ''}.` : '',
    ].filter(Boolean).join(' ');
    const updated: WorkflowOrder = {
      ...order,
      status: nextStatus,
      exitDate: nextStatus === 'Entregue' ? new Date().toISOString().slice(0, 10) : order.exitDate,
      serviceAuthorized: authorized,
      authorizationAt: authorized ? (order.authorizationAt ?? now) : undefined,
      authorizationMethod: authorized ? authorizationMethod : undefined,
      authorizationNote: authorized ? authorizationNote : undefined,
      history: [...order.history, { at: now, status: nextStatus, note: notes }],
    };
    const feedback = panel.querySelector<HTMLElement>('[data-workflow-feedback]');
    try {
      if (firebaseEnabled) await saveRecord('serviceOrders', updated);
      orders.set(normalizeId(updated.id), updated);
      if (feedback) feedback.textContent = 'Movimentação salva.';
      panel.remove();
      renderWorkflow(card, updated);
      const statusStrong = card.querySelector('strong');
      if (statusStrong) statusStrong.textContent = `${updated.id.toUpperCase()} · ${updated.status}`;
    } catch {
      if (feedback) feedback.textContent = 'Não foi possível salvar. Confira a conexão.';
    }
  });
}

function installCards() {
  document.querySelectorAll<HTMLElement>('.order-card').forEach((card) => {
    const id = orderIdFromCard(card);
    const order = orders.get(id);
    if (order) renderWorkflow(card, order);
  });
}

export function installStatusWorkflowEnhancer() {
  subscribeToCollection<WorkflowOrder>('serviceOrders', (items) => {
    orders = new Map(items.map((item) => [normalizeId(item.id), item]));
    installCards();
  }, () => installCards());
  const observer = new MutationObserver(installCards);
  observer.observe(document.body, { childList: true, subtree: true });
  installCards();
}
