import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { useRealtimeCollection } from './useRealtimeCollection';

const subscription = vi.hoisted(() => ({
  onData: undefined as undefined | ((items: Array<{ id: string; name: string }>) => void),
  subscribe: vi.fn((_path, onData) => {
    subscription.onData = onData;
    return vi.fn();
  }),
}));

vi.mock('../services/firebase', () => ({
  firebaseEnabled: true,
  subscribeToCollection: subscription.subscribe,
}));

function Harness({ enabled }: { enabled: boolean }) {
  const [items, , connected] = useRealtimeCollection('clients', [{ id: 'demo', name: 'Demonstração' }], enabled);
  return <div><span>{connected ? 'nuvem' : 'local'}</span><strong>{items.map((item) => item.name).join(',')}</strong></div>;
}

beforeEach(() => {
  subscription.subscribe.mockClear();
  subscription.onData = undefined;
});

test('troca os dados locais pela coleção da nuvem após autenticar', () => {
  const view = render(<Harness enabled={false}/>);
  expect(screen.getByText('Demonstração')).toBeInTheDocument();
  expect(subscription.subscribe).not.toHaveBeenCalled();

  view.rerender(<Harness enabled/>);
  expect(subscription.subscribe).toHaveBeenCalledTimes(1);
  act(() => subscription.onData?.([{ id: 'cloud', name: 'Cliente na nuvem' }]));

  expect(screen.getByText('nuvem')).toBeInTheDocument();
  expect(screen.getByText('Cliente na nuvem')).toBeInTheDocument();
  expect(screen.queryByText('Demonstração')).not.toBeInTheDocument();
});
