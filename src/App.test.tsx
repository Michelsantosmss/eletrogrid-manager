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
