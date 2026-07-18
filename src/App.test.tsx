import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('./services/firebase', async (importOriginal) => ({
  ...await importOriginal<typeof import('./services/firebase')>(),
  firebaseEnabled: false,
}));

import App from './App';

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
  fireEvent.click(screen.getByRole('button', { name: 'Clientes' }));

  expect(screen.getByText(/Hospital S/i)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Pesquisa global'), { target: { value: 'Condom' } });

  expect(screen.getByText(/Condom/i)).toBeInTheDocument();
  expect(screen.queryByText(/Hospital S/i)).not.toBeInTheDocument();
});

test('cria uma OS numerada e vincula uma etiqueta QR ao equipamento', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: /Ordens de servi/i }));
  fireEvent.change(screen.getByPlaceholderText('Problema relatado'), { target: { value: 'Teste da etiqueta QR' } });
  fireEvent.click(screen.getByRole('button', { name: /Gerar OS automaticamente/i }));

  expect(screen.getByText('OS-000003 · Recebido')).toBeInTheDocument();
  expect(screen.getByText('Etiqueta QR do equipamento')).toBeInTheDocument();
});

test('atualiza o total do orçamento ao informar o valor unitário', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: /Ordens de servi/i }));
  fireEvent.click(screen.getAllByRole('button', { name: /Criar orçamento/i })[0]);

  fireEvent.change(screen.getByLabelText('Valor unitário'), { target: { value: '150' } });

  expect(screen.getByText((content) => content.includes('TOTAL:') && content.includes('150,00'))).toBeInTheDocument();
});

test('leva o total do orçamento para a nota e permite alterar o valor', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: /Ordens de serviço/i }));
  fireEvent.click(screen.getAllByRole('button', { name: /Criar orçamento/i })[0]);
  fireEvent.change(screen.getByLabelText('Descrição do item'), { target: { value: 'Serviço realizado' } });
  fireEvent.change(screen.getByLabelText('Valor unitário'), { target: { value: '150' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar orçamento' }));

  fireEvent.click(screen.getByRole('button', { name: /Ordens de serviço/i }));
  const valueInput = screen.getAllByLabelText(/Valor do serviço/i)[0] as HTMLInputElement;
  expect(valueInput).toHaveValue(150);
  fireEvent.change(valueInput, { target: { value: '200' } });
  expect(valueInput).toHaveValue(200);
  expect(screen.getAllByRole('button', { name: /Baixar nota PDF/i })[0]).toBeEnabled();
});

test('vincula cliente e equipamento novos ao criar uma OS', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /modo demonstra/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Clientes' }));
  fireEvent.change(screen.getByPlaceholderText('Nome'), { target: { value: 'Cliente Novo' } });
  fireEvent.change(screen.getByPlaceholderText('Telefone'), { target: { value: '11999999999' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar cliente' }));

  fireEvent.click(screen.getByRole('button', { name: 'Equipamentos' }));
  const equipmentClient = screen.getByLabelText('Cliente do equipamento');
  const newClientOption = screen.getByRole('option', { name: 'Cliente Novo' }) as HTMLOptionElement;
  fireEvent.change(equipmentClient, { target: { value: newClientOption.value } });
  fireEvent.change(screen.getByPlaceholderText('Marca'), { target: { value: 'Marca Nova' } });
  fireEvent.change(screen.getByPlaceholderText('Modelo'), { target: { value: 'Modelo Novo' } });
  fireEvent.change(screen.getByPlaceholderText('Número de série / IMEI'), { target: { value: 'SERIE-NOVA' } });
  fireEvent.change(screen.getByPlaceholderText('Estado na entrada'), { target: { value: 'Bom estado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar equipamento' }));

  fireEvent.click(screen.getByRole('button', { name: /Ordens de serviço/i }));
  const orderClient = screen.getByLabelText('Cliente da nova OS');
  fireEvent.change(orderClient, { target: { value: newClientOption.value } });
  expect(screen.getByRole('option', { name: 'Marca Nova Modelo Novo' })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Problema relatado'), { target: { value: 'Teste do vínculo' } });
  fireEvent.click(screen.getByRole('button', { name: /Gerar OS automaticamente/i }));
  expect(screen.getByText('Teste do vínculo')).toBeInTheDocument();
});
