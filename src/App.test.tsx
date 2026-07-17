import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from './App';

afterEach(cleanup);

test('exibe a tela de acesso', () => {
  render(<App />);
  expect(screen.getByText('EletroGrid Manager')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /modo demonstra/i })).toBeInTheDocument();
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
