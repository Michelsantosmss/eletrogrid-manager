const filenamePart = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function documentFilename(
  type: 'orcamento' | 'nota-de-servico',
  clientName: string | undefined,
  serviceOrderId: string,
) {
  const client = filenamePart(clientName || 'cliente-nao-identificado');
  const order = filenamePart(serviceOrderId);
  return `${type}-${client}-${order}.pdf`;
}
