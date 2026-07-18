type IntakeRecord = {
  id: string;
  createdAt: string;
  client: string;
  phone: string;
  equipment: string;
  brand: string;
  model: string;
  serial: string;
  defect: string;
  accessories: string;
  condition: string[];
  notes: string;
  signature: string;
};

const STORAGE_KEY = 'eletrogrid:intake-records';

const readRecords = (): IntakeRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as IntakeRecord[];
  } catch {
    return [];
  }
};

const saveRecords = (records: IntakeRecord[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);

function renderRecords(container: HTMLElement) {
  const records = readRecords();
  const list = container.querySelector<HTMLElement>('[data-intake-list]');
  if (!list) return;
  if (!records.length) {
    list.innerHTML = '<p class="intake-empty">Nenhuma recepção registrada neste aparelho.</p>';
    return;
  }
  list.innerHTML = records.map((record) => `
    <article class="intake-record">
      <div><strong>${escapeHtml(record.id)}</strong><span>${escapeHtml(record.createdAt)}</span></div>
      <b>${escapeHtml(record.client)}</b>
      <span>${escapeHtml(record.equipment)} · ${escapeHtml(record.brand)} ${escapeHtml(record.model)}</span>
      <span>Defeito: ${escapeHtml(record.defect)}</span>
      <button type="button" data-print-intake="${record.id}">Imprimir ficha</button>
    </article>`).join('');
}

function printRecord(record: IntakeRecord) {
  const popup = window.open('', '_blank', 'width=900,height=900');
  if (!popup) return;
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(record.id)}</title><style>body{font-family:Arial,sans-serif;color:#15233b;margin:32px}header{background:#08295f;color:white;padding:20px;border-bottom:6px solid #f68b1f}h1{margin:0;font-size:24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px}.box{border:1px solid #ccd6e4;padding:12px;border-radius:6px}.wide{grid-column:1/-1}small{color:#66758d;display:block;margin-bottom:5px}.signature{margin-top:45px;border-top:1px solid #222;padding-top:8px;text-align:center}@media print{body{margin:12mm}}</style></head><body><header><h1>ELETROGRID · RECEPÇÃO DO EQUIPAMENTO</h1><div>${escapeHtml(record.id)} · ${escapeHtml(record.createdAt)}</div></header><section class="grid"><div class="box"><small>Cliente</small>${escapeHtml(record.client)}</div><div class="box"><small>Telefone</small>${escapeHtml(record.phone)}</div><div class="box"><small>Equipamento</small>${escapeHtml(record.equipment)}</div><div class="box"><small>Marca / modelo</small>${escapeHtml(record.brand)} ${escapeHtml(record.model)}</div><div class="box wide"><small>Número de série</small>${escapeHtml(record.serial || 'Não informado')}</div><div class="box wide"><small>Defeito relatado</small>${escapeHtml(record.defect)}</div><div class="box wide"><small>Acessórios entregues</small>${escapeHtml(record.accessories || 'Nenhum informado')}</div><div class="box wide"><small>Estado físico</small>${escapeHtml(record.condition.join(', ') || 'Sem observações')}</div><div class="box wide"><small>Observações</small>${escapeHtml(record.notes || 'Sem observações')}</div></section><div class="signature">${escapeHtml(record.signature || 'Assinatura do cliente')}</div><script>window.print()</script></body></html>`);
  popup.document.close();
}

function createPanel() {
  const panel = document.createElement('section');
  panel.className = 'intake-panel';
  panel.hidden = true;
  panel.dataset.intakePanel = 'true';
  panel.innerHTML = `<div class="intake-heading"><div><span>Entrada técnica</span><h2>Recepção do equipamento</h2><p>Registre o estado de chegada e gere uma ficha pronta para impressão.</p></div><strong>Ficha de entrada</strong></div><form class="intake-form" data-intake-form><fieldset><legend>Cliente</legend><label>Nome do cliente<input name="client" required></label><label>Telefone<input name="phone" inputmode="tel" required></label></fieldset><fieldset><legend>Equipamento</legend><label>Tipo do equipamento<input name="equipment" placeholder="TV, notebook, inversor..." required></label><label>Marca<input name="brand" required></label><label>Modelo<input name="model" required></label><label>Número de série<input name="serial"></label></fieldset><fieldset class="wide"><legend>Relato de entrada</legend><label class="wide">Defeito relatado<textarea name="defect" required></textarea></label><label class="wide">Acessórios entregues<textarea name="accessories" placeholder="Controle, fonte, cabo, suporte..."></textarea></label></fieldset><fieldset class="wide"><legend>Checklist do estado físico</legend><div class="intake-checks">${['Tela quebrada','Riscos','Trincas','Amassados','Oxidação','Parafusos faltando','Já foi aberto','Sem avarias aparentes'].map((item) => `<label><input type="checkbox" name="condition" value="${item}">${item}</label>`).join('')}</div></fieldset><fieldset class="wide"><legend>Registro complementar</legend><label>Fotos de entrada<input type="file" name="photos" accept="image/*" capture="environment" multiple></label><label>Nome para assinatura<input name="signature" placeholder="Nome completo do cliente"></label><label class="wide">Observações<textarea name="notes"></textarea></label><div class="photo-preview" data-photo-preview></div></fieldset><div class="intake-actions"><button type="reset" class="ghost-button">Limpar</button><button type="submit">Salvar recepção e gerar ficha</button></div></form><div class="intake-history"><h3>Recepções recentes</h3><div data-intake-list></div></div>`;
  return panel;
}

export function installIntakeEnhancer() {
  const install = () => {
    const nav = document.querySelector('.sidebar nav');
    const content = document.querySelector<HTMLElement>('.content');
    if (!nav || !content || nav.querySelector('[data-intake-nav]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-button';
    button.dataset.intakeNav = 'true';
    button.textContent = 'Recepção';
    nav.appendChild(button);
    const panel = createPanel();
    content.appendChild(panel);
    const regularModules = [...nav.querySelectorAll<HTMLButtonElement>('.nav-button:not([data-intake-nav])')];
    button.addEventListener('click', () => {
      regularModules.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      [...content.children].forEach((child) => {
        if (child === content.querySelector('.hero') || child === panel) return;
        (child as HTMLElement).hidden = true;
      });
      panel.hidden = false;
      renderRecords(panel);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    regularModules.forEach((item) => item.addEventListener('click', () => {
      button.classList.remove('active');
      panel.hidden = true;
      [...content.children].forEach((child) => {
        if (child !== panel) (child as HTMLElement).hidden = false;
      });
    }));
    const form = panel.querySelector<HTMLFormElement>('[data-intake-form]')!;
    const photos = form.elements.namedItem('photos') as HTMLInputElement;
    photos.addEventListener('change', () => {
      const preview = panel.querySelector<HTMLElement>('[data-photo-preview]')!;
      preview.innerHTML = '';
      [...(photos.files ?? [])].slice(0, 4).forEach((file) => {
        const img = document.createElement('img');
        img.alt = file.name;
        img.src = URL.createObjectURL(file);
        preview.appendChild(img);
      });
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const records = readRecords();
      const record: IntakeRecord = {
        id: `REC-${String(records.length + 1).padStart(5, '0')}`,
        createdAt: new Date().toLocaleString('pt-BR'),
        client: String(data.get('client') ?? ''),
        phone: String(data.get('phone') ?? ''),
        equipment: String(data.get('equipment') ?? ''),
        brand: String(data.get('brand') ?? ''),
        model: String(data.get('model') ?? ''),
        serial: String(data.get('serial') ?? ''),
        defect: String(data.get('defect') ?? ''),
        accessories: String(data.get('accessories') ?? ''),
        condition: data.getAll('condition').map(String),
        notes: String(data.get('notes') ?? ''),
        signature: String(data.get('signature') ?? ''),
      };
      saveRecords([record, ...records]);
      renderRecords(panel);
      printRecord(record);
      form.reset();
      panel.querySelector<HTMLElement>('[data-photo-preview]')!.innerHTML = '';
    });
    panel.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const id = target.getAttribute('data-print-intake');
      if (!id) return;
      const record = readRecords().find((item) => item.id === id);
      if (record) printRecord(record);
    });
  };
  const observer = new MutationObserver(install);
  observer.observe(document.body, { childList: true, subtree: true });
  install();
}
