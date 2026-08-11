import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('./services/firebase', async (importOriginal) => ({
  ...await importOriginal<typeof import('./services/firebase')>(),
  firebaseEnabled: false,
}));

import App, { orderFromQr } from './App';
import { OperationsDashboard } from './components/OperationsDashboard';

afterEach(cleanup);

test('exibe a tela de acesso', () => {
  render(<App />);
  expect(screen.getByText('EletroGrid Manager')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /modo demonstra/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Esqueci minha senha/i })).toBeInTheDocument();
});

test('solicita o e-mail antes de recuperar a senha', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Esqueci minha senha/i }));
  expect(screen.getByRole('alert')).toHaveTextContent('Digite seu e-mail');
});

test('permite navegar e pesquisar clientes no modo demonstracao', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  expect(screen.getByText('Modo demonstração')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clientes' }));

  expect(screen.getByText(/Hospital S/i)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Pesquisa global'), { target: { value: 'Condom' } });

  expect(screen.getByText(/Condom/i)).toBeInTheDocument();
  expect(screen.queryByText(/Hospital S/i)).not.toBeInTheDocument();
});

test('cria uma OS numerada e vincula uma etiqueta QR ao equipamento', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: /Ordens de servi/i }));
  fireEvent.change(screen.getByPlaceholderText('Problema relatado'), { target: { value: 'Teste da etiqueta QR' } });
  fireEvent.click(screen.getByRole('button', { name: /Gerar OS automaticamente/i }));

  expect(await screen.findByText('OS-000003 · Recebido')).toBeInTheDocument();
  expect(screen.getByText('Etiqueta QR do equipamento')).toBeInTheDocument();
  expect(screen.getByText(/Aparelho: Nobreak Smart 3kVA · Marca: APC · Defeito: Oscilação/i)).toBeInTheDocument();
});

test('atualiza o total do orçamento ao informar o valor unitário', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: /Ordens de servi/i }));
  fireEvent.click(screen.getAllByRole('button', { name: /Criar orçamento/i })[0]);

  fireEvent.change(screen.getByLabelText('Valor unitário'), { target: { value: '150' } });

  expect(screen.getByText((content) => content.includes('TOTAL:') && content.includes('150,00'))).toBeInTheDocument();
});

test('leva o total do orçamento para a nota e permite alterar o valor', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: /Ordens de serviço/i }));
  fireEvent.click(screen.getAllByRole('button', { name: /Criar orçamento/i })[0]);
  fireEvent.change(screen.getByLabelText('Descrição do item'), { target: { value: 'Serviço realizado' } });
  fireEvent.change(screen.getByLabelText('Valor unitário'), { target: { value: '150' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvar orçamento' })).not.toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: /Ordens de serviço/i }));
  const valueInput = screen.getAllByLabelText(/Valor do serviço/i)[0] as HTMLInputElement;
  expect(valueInput).toHaveValue(150);
  fireEvent.change(valueInput, { target: { value: '200' } });
  expect(valueInput).toHaveValue(200);
  expect(screen.queryByRole('button', { name: /Baixar nota PDF/i })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Orçamentos' }));
  const approveButton = screen.getByRole('button', { name: 'Aprovar e lançar' });
  fireEvent.click(approveButton);
  await waitFor(() => expect(approveButton).toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));
  expect(screen.getByRole('button', { name: /Baixar nota PDF/i })).toBeEnabled();
});

test('vincula cliente e equipamento novos ao criar uma OS', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Clientes' }));
  fireEvent.change(screen.getByPlaceholderText('Nome'), { target: { value: 'Cliente Novo' } });
  fireEvent.change(screen.getByPlaceholderText('Telefone'), { target: { value: '11999999999' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }));
  await screen.findByText('Cliente Novo');

  fireEvent.click(screen.getByRole('button', { name: 'Equipamentos' }));
  const equipmentClient = screen.getByLabelText('Cliente do equipamento');
  const newClientOption = screen.getByRole('option', { name: 'Cliente Novo' }) as HTMLOptionElement;
  fireEvent.change(equipmentClient, { target: { value: newClientOption.value } });
  fireEvent.change(screen.getByPlaceholderText('Equipamento'), { target: { value: 'Notebook' } });
  fireEvent.change(screen.getByPlaceholderText('Marca'), { target: { value: 'Marca Nova' } });
  fireEvent.change(screen.getByPlaceholderText('Modelo'), { target: { value: 'Modelo Novo' } });
  fireEvent.change(screen.getByPlaceholderText('Número de série / IMEI'), { target: { value: 'SERIE-NOVA' } });
  fireEvent.change(screen.getByPlaceholderText('Estado na entrada'), { target: { value: 'Bom estado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar equipamento' }));
  await screen.findByText('Marca Nova Modelo Novo');
  expect(screen.getByText('Equipamento: Notebook')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Ordens de serviço/i }));
  const orderClient = screen.getByLabelText('Cliente da nova OS');
  fireEvent.change(orderClient, { target: { value: newClientOption.value } });
  expect(screen.getByRole('option', { name: 'Marca Nova Modelo Novo' })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Problema relatado'), { target: { value: 'Teste do vínculo' } });
  fireEvent.click(screen.getByRole('button', { name: /Gerar OS automaticamente/i }));
  expect(await screen.findByText(/Defeito: Teste do vínculo/i)).toBeInTheDocument();
});

test('oferece instalação de ar-condicionado split como categoria', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Equipamentos' }));
  expect(screen.getByRole('option', { name: 'Instalação de ar-condicionado split' })).toBeInTheDocument();
});

test('dashboard usa somente as ordens e o faturamento recebidos da conta', () => {
  render(<OperationsDashboard
    clients={[]}
    equipment={[]}
    orders={[{ id: 'os-000004', clientId: 'cliente', equipmentId: 'equipamento', status: 'Entregue', intakeDate: '2026-07-18', problem: 'Serviço concluído', diagnosis: '', history: [] }]}
    finance={[{ id: 'fin-120', type: 'Receber', description: 'Serviço OS-000004', amount: 120, dueDate: '2026-07-18', paid: false }]}
    demo={false}
  />);

  expect(screen.getByText('1 ordens registradas')).toBeInTheDocument();
  expect(screen.getAllByText('Em análise')[0].closest('.status-card')).toHaveTextContent('00');
  expect(screen.getAllByText('Aguardando peça')[0].closest('.status-card')).toHaveTextContent('00');
  expect(screen.getAllByText('Entregue')[0].closest('.status-card')).toHaveTextContent('01');
  expect(screen.getByText('Ordens abertas').closest('.status-card')).toHaveTextContent('00');
  expect(screen.getByText('A receber')).toBeInTheDocument();
  expect(screen.getAllByText('R$ 120,00')).toHaveLength(2);
  expect(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].every((month) => screen.getByText(month))).toBe(true);
});

test('dashboard desconta peças e exibe o faturamento líquido previsto', () => {
  render(<OperationsDashboard
    clients={[]}
    equipment={[]}
    orders={[]}
    finance={[{ id: 'fin-280', type: 'Receber', description: 'Orçamento ORC-1', amount: 280, materialAmount: 80, dueDate: '2026-07-24', paid: false }]}
    demo={false}
  />);

  expect(screen.getAllByText('R$ 200,00')).toHaveLength(2);
  expect(screen.queryByText('R$ 280,00')).not.toBeInTheDocument();
});

test('permite selecionar o faturamento previsto de um mês no gráfico', () => {
  render(<OperationsDashboard
    clients={[]}
    equipment={[]}
    orders={[]}
    finance={[
      { id: 'fin-jul', type: 'Receber', description: 'Julho', amount: 120, dueDate: '2026-07-10', paid: false },
      { id: 'fin-ago', type: 'Receber', description: 'Agosto', amount: 250, materialAmount: 50, dueDate: '2026-08-10', paid: false },
    ]}
    demo={false}
  />);

  fireEvent.click(screen.getByRole('button', { name: 'Ver faturamento de Ago' }));
  expect(screen.getByText('Ago 2026')).toBeInTheDocument();
  expect(screen.getAllByText('R$ 200,00')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Ver faturamento de Ago' })).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(screen.getByRole('button', { name: 'Ver total anual' }));
  expect(screen.getByText('Total anual')).toBeInTheDocument();
  expect(screen.getAllByText('R$ 320,00')).toHaveLength(2);
});

test('dashboard exibe exatamente os status cadastrados nas ordens', () => {
  const finalizada = (id: string) => ({ id, clientId: 'cli', equipmentId: 'eq', status: 'Finalizado' as const, intakeDate: '2026-07-24', problem: '', diagnosis: '', history: [] });
  render(<OperationsDashboard
    clients={[]}
    equipment={[]}
    orders={[finalizada('os-1'), finalizada('os-2')]}
    finance={[]}
    demo={false}
  />);

  expect(screen.getAllByText('Finalizado')[0].closest('.status-card')).toHaveTextContent('02');
  expect(screen.queryByText('Em testes')).not.toBeInTheDocument();
});

test('acompanhamento mostra somente as cinco OS mais recentes em ordem de criação', () => {
  const order = (number: number, date: string) => ({ id: `os-${number.toString().padStart(6, '0')}`, clientId: 'cli', equipmentId: 'eq', status: 'Recebido' as const, intakeDate: date, problem: `Ordem ${number}`, diagnosis: '', history: [] });
  const { container } = render(<OperationsDashboard
    clients={[]}
    equipment={[]}
    orders={[order(2, '2026-07-20'), order(7, '2026-07-22'), order(1, '2026-07-19'), order(5, '2026-07-21'), order(6, '2026-07-22'), order(3, '2026-07-20'), order(4, '2026-07-21')]}
    finance={[]}
    demo={false}
  />);

  const displayedOrders = [...container.querySelectorAll('.recent-order-row strong')].map((item) => item.textContent);
  expect(displayedOrders).toEqual(['OS-000007', 'OS-000006', 'OS-000005', 'OS-000004', 'OS-000003']);
  expect(screen.queryByText('OS-000002')).not.toBeInTheDocument();
});

test('abre as ordens filtradas ao clicar em um cartão operacional com registros', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));

  const emptyCard = screen.getByRole('button', { name: /Ver 0 OS com status Recebido/i });
  expect(emptyCard).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Ver 1 OS com status Em análise/i }));

  expect(await screen.findByRole('heading', { name: 'Ordens de serviço' })).toBeInTheDocument();
  expect(screen.getByLabelText('Filtrar ordens por status')).toHaveValue('Em análise');
  expect(screen.getByText(/OS-1 · Em análise/i)).toBeInTheDocument();
  expect(screen.queryByText(/OS-2 · Aguardando peça/i)).not.toBeInTheDocument();
});

test('permite marcar um lançamento como recebido e atualiza o dashboard', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));
  fireEvent.click(screen.getByRole('button', { name: 'Marcar como recebido' }));
  fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));

  expect(screen.getAllByText('Recebido').length).toBeGreaterThan(0);
});

test('localiza a OS pelo conteúdo da etiqueta QR Code', () => {
  const order = { id: 'os-000004', clientId: 'cli', equipmentId: 'eq', status: 'Entregue' as const, intakeDate: '2026-07-18', problem: '', diagnosis: '', history: [], qrCode: { value: 'ELETROGRID|OS-000004|eq', url: 'qr.png' } };
  expect(orderFromQr('ELETROGRID|OS-000004|eq', [order])).toBe(order);
  expect(orderFromQr('OS-000004', [order])).toBe(order);
});

test('abre a ordem ao informar manualmente o código do QR', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  expect(screen.queryByRole('button', { name: 'Ler QR Code' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ordens de serviço' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ler QR Code' }));
  fireEvent.change(screen.getByPlaceholderText(/ELETROGRID\|OS-000004/i), { target: { value: 'ELETROGRID|OS-1|eq-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Localizar OS' }));

  expect(await screen.findByRole('heading', { name: 'Ordens de serviço' })).toBeInTheDocument();
  expect(await screen.findByText(/OS-1 · Em análise/i)).toBeInTheDocument();
});

test('permite alterar e salvar o status da OS', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Ordens de serviço' }));
  fireEvent.change(screen.getByLabelText('Status os-1'), { target: { value: 'Entregue' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar status OS-1' }));

  expect(await screen.findByText(/OS-1 · Entregue/i)).toBeInTheDocument();
  expect(screen.getByLabelText('Status os-1')).toHaveValue('Entregue');
});

test('permite editar os dados principais de uma OS', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Ordens de serviço' }));
  fireEvent.click(screen.getByRole('button', { name: 'Editar OS OS-1' }));
  fireEvent.change(screen.getByPlaceholderText('Problema relatado'), { target: { value: 'Problema corrigido na edição' } });
  fireEvent.change(screen.getByLabelText('Status da OS em edição'), { target: { value: 'Finalizado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar OS' }));

  expect(await screen.findByText(/Defeito: Problema corrigido na edição/i)).toBeInTheDocument();
  expect(screen.getByLabelText('Status os-1')).toHaveValue('Finalizado');
});

test('permite excluir uma OS após confirmação', async () => {
  const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Ordens de serviço' }));
  fireEvent.click(screen.getByRole('button', { name: 'Excluir OS OS-1' }));

  await waitFor(() => expect(screen.queryByText(/OS-1 · Em análise/i)).not.toBeInTheDocument());
  confirmation.mockRestore();
});

test('permite editar e excluir um orçamento', async () => {
  const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true);
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = vi.fn();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Ordens de serviço' }));
  fireEvent.click(screen.getAllByRole('button', { name: /Criar orçamento/i })[0]);
  fireEvent.change(screen.getByLabelText('Descrição do item'), { target: { value: 'Orçamento original' } });
  fireEvent.change(screen.getByLabelText('Valor unitário'), { target: { value: '120' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }));
  expect(await screen.findByText(/Orçamento original/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Editar orçamento ORC-/i }));
  await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  expect(screen.getByText('Editar orçamento', { selector: 'strong' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Descrição do item'), { target: { value: 'Orçamento atualizado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }));
  expect(await screen.findByText(/Orçamento atualizado/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Excluir orçamento ORC-/i }));
  await waitFor(() => expect(screen.queryByText(/Orçamento atualizado/i)).not.toBeInTheDocument());
  if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView;
  else delete (Element.prototype as { scrollIntoView?: typeof Element.prototype.scrollIntoView }).scrollIntoView;
  confirmation.mockRestore();
});

test('separa serviços e materiais e desconta as peças do valor a receber', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Ordens de serviço' }));
  fireEvent.click(screen.getAllByRole('button', { name: /Criar orçamento/i })[0]);

  fireEvent.change(screen.getByLabelText('Descrição do item'), { target: { value: 'Instalação' } });
  fireEvent.change(screen.getByLabelText('Valor unitário'), { target: { value: '200' } });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));
  const descriptions = screen.getAllByLabelText('Descrição do item');
  const types = screen.getAllByLabelText('Tipo do item');
  const prices = screen.getAllByLabelText('Valor unitário');
  fireEvent.change(descriptions[1], { target: { value: 'Peça de reposição' } });
  fireEvent.change(types[1], { target: { value: 'Peça/material' } });
  fireEvent.change(prices[1], { target: { value: '80' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }));
  const quoteCard = (await screen.findByText(/Peça de reposição/i)).closest('article');
  const approveButton = quoteCard!.querySelector('button:not([aria-label]):last-child') as HTMLButtonElement;
  fireEvent.click(approveButton);
  await waitFor(() => expect(approveButton).toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));

  expect(screen.getByText('Serviços a receber').closest('article')).toHaveTextContent('R$ 800,00');
  expect(screen.getByText('Materiais/peças').closest('article')).toHaveTextContent('R$ 80,00');
  const financeCard = screen.getByText(/Hospital São Lucas - OS-1/i).closest('article');
  expect(financeCard).toHaveTextContent('Aparelho: Nobreak Smart 3kVA · Marca: APC · Defeito: Oscilação');
  expect(financeCard).toHaveTextContent('Serviços: R$ 200,00');
  expect(financeCard).toHaveTextContent('Materiais/peças: R$ 80,00');
});
