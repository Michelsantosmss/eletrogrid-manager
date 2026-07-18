const labelsByAria: Record<string, string> = {
  'Descrição do item': 'Descrição do serviço, peça ou material',
  'Tipo do item': 'Tipo de item',
  Quantidade: 'Quantidade',
  'Valor unitário': 'Valor unitário (R$)',
  Desconto: 'Desconto (R$)',
  'Prazo de execução': 'Prazo de entrega',
  'Garantia do orçamento': 'Garantia',
  'Condições e observações': 'Condições e observações',
};

function addVisibleLabel(control: HTMLElement) {
  const aria = control.getAttribute('aria-label');
  if (!aria || control.previousElementSibling?.classList.contains('eg-field-label')) return;

  const label = document.createElement('span');
  label.className = 'eg-field-label';
  label.textContent = labelsByAria[aria] ?? aria;
  control.parentElement?.insertBefore(label, control);
}

function section(title: string) {
  const heading = document.createElement('h3');
  heading.className = 'eg-form-section-title';
  heading.textContent = title;
  return heading;
}

function enhanceQuoteForm(form: HTMLFormElement) {
  if (form.dataset.egEnhanced === 'true') return;
  form.dataset.egEnhanced = 'true';
  form.classList.add('eg-quote-form');

  const heading = form.querySelector('.quote-form-heading');
  const firstItem = form.querySelector('.quote-item-row');
  const conditions = form.querySelector('.quote-conditions');
  const total = form.querySelector('.quote-total');

  if (heading && firstItem) heading.after(section('1. DADOS DO SERVIÇO'));

  const itemRows = Array.from(form.querySelectorAll<HTMLElement>('.quote-item-row'));
  itemRows.forEach((row, index) => {
    row.classList.add('eg-quote-item-row');
    if (index === 0) {
      const description = row.querySelector<HTMLInputElement>('[aria-label="Descrição do item"]');
      if (description) {
        description.classList.add('eg-main-description');
        description.placeholder = 'Descreva detalhadamente o serviço, peça ou material';
      }
    }
    row.querySelectorAll<HTMLElement>('input, select, textarea').forEach(addVisibleLabel);
  });

  const addButton = Array.from(form.querySelectorAll<HTMLButtonElement>('button')).find((button) => button.textContent?.includes('Adicionar item'));
  if (addButton) addButton.before(section('2. ITENS DO ORÇAMENTO'));

  if (conditions) {
    conditions.before(section('3. VALORES, PRAZOS E GARANTIA'));
    conditions.querySelectorAll<HTMLElement>('input, select, textarea').forEach(addVisibleLabel);
  }

  if (total) {
    total.classList.add('eg-total-highlight');
    total.textContent = total.textContent?.replace('Total:', 'TOTAL') ?? 'TOTAL';
  }

  const saveButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (saveButton) saveButton.classList.add('eg-save-quote');
}

function scan() {
  document.querySelectorAll<HTMLFormElement>('.quote-form').forEach(enhanceQuoteForm);
}

export function installQuoteFormEnhancer() {
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
}
