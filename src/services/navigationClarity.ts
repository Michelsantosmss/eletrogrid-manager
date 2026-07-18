const labels: Record<string, { icon: string; title: string; subtitle: string }> = {
  Dashboard: { icon: '▦', title: 'Dashboard', subtitle: 'Visão geral' },
  Clientes: { icon: '👤', title: 'Clientes', subtitle: 'Cadastros' },
  Equipamentos: { icon: '▣', title: 'Equipamentos', subtitle: 'Aparelhos' },
  'Ordens de serviço': { icon: '🛠', title: 'Ordens de serviço', subtitle: 'Entrada e reparo' },
  Orçamentos: { icon: 'R$', title: 'Orçamentos', subtitle: 'Propostas e valores' },
  Financeiro: { icon: '↗', title: 'Financeiro', subtitle: 'Contas e caixa' },
  Recepção: { icon: '＋', title: 'Recepção', subtitle: 'Nova entrada' },
};

function enhanceNavigation() {
  document.querySelectorAll<HTMLButtonElement>('.sidebar .nav-button').forEach((button) => {
    const raw = button.textContent?.trim() ?? '';
    const item = labels[raw];
    if (!item || button.dataset.clarityReady) return;
    button.dataset.clarityReady = 'true';
    button.setAttribute('aria-label', `${item.title}: ${item.subtitle}`);
    button.innerHTML = `<span class="nav-icon" aria-hidden="true">${item.icon}</span><span class="nav-copy"><strong>${item.title}</strong><small>${item.subtitle}</small></span>`;
  });
}

function enhanceQuoteButtons() {
  document.querySelectorAll<HTMLButtonElement>('.order-card button').forEach((button) => {
    if (button.textContent?.trim() === 'Criar orçamento') {
      button.textContent = 'Gerar orçamento desta OS';
      button.classList.add('primary-quote-action');
    }
  });
}

function addQuoteGuide() {
  const title = [...document.querySelectorAll('h1,h2')].find((item) => item.textContent?.trim() === 'Orçamentos');
  const section = title?.closest('section');
  if (!section || section.querySelector('[data-quote-guide]')) return;

  const hasForm = Boolean(section.querySelector('.quote-form'));
  const guide = document.createElement('div');
  guide.dataset.quoteGuide = 'true';
  guide.className = 'quote-guide';
  guide.innerHTML = hasForm
    ? `<div><strong>Orçamento em edição</strong><span>Preencha os serviços ou peças, confira o total e toque em “Salvar orçamento”.</span></div>`
    : `<div><strong>Como gerar um orçamento</strong><span>O orçamento precisa estar ligado a uma Ordem de Serviço. Abra a OS desejada e toque em “Gerar orçamento desta OS”.</span></div><button type="button" data-open-orders>Ir para Ordens de Serviço</button>`;
  title.parentElement?.parentElement?.insertAdjacentElement('afterend', guide);

  guide.querySelector<HTMLButtonElement>('[data-open-orders]')?.addEventListener('click', () => {
    const target = [...document.querySelectorAll<HTMLButtonElement>('.nav-button')].find((button) => button.textContent?.includes('Ordens de serviço'));
    target?.click();
  });
}

export function installNavigationClarity() {
  const run = () => {
    enhanceNavigation();
    enhanceQuoteButtons();
    addQuoteGuide();
  };
  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
  run();
}
