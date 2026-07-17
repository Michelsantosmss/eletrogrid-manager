# EletroGrid Manager

Sistema de gestão para assistência técnica em eletrônicos, energia solar e serviços elétricos.

## Recursos

- Autenticação Firebase, com modo demonstração quando o Firebase não estiver configurado.
- Dashboard operacional em tempo real, com indicadores de OS e financeiro.
- CRUD de clientes e equipamentos, pesquisa global e filtros de status.
- OS numerada automaticamente, histórico de alterações, anexos e QR code por equipamento.
- Orçamentos, contas a receber e documentos imprimíveis de OS e orçamento.
- Todos os documentos gerados usam o cabeçalho da EletroGrid.

## Configuração Firebase

1. Crie um projeto no Firebase e habilite Authentication com e-mail/senha, Cloud Firestore e Storage.
2. Copie `.env.example` para `.env`.
3. Preencha as variáveis `VITE_FIREBASE_*` com a configuração do app Web no Firebase Console.
4. Publique as regras e o Hosting:

```bash
npm run build
firebase deploy --only firestore:rules,storage,hosting
```

As regras versionadas exigem usuário autenticado para as coleções `clients`, `equipment`, `serviceOrders`, `quotes` e `finance`.

## Anexos com Supabase Storage

Para manter os anexos fora do Firebase Storage, crie um projeto gratuito no Supabase e informe no `.env` a URL do projeto e a chave pública anônima (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).

Crie um bucket chamado `service-orders` e ative `Anonymous Sign-Ins` em **Authentication → Providers**. Para documentos de clientes, mantenha o bucket privado. A integração cria uma sessão anônima de Storage e usa URLs assinadas, sem expor chaves de serviço no navegador.

No **SQL Editor** do Supabase, aplique as políticas abaixo para permitir que cada sessão envie e leia somente seus próprios anexos:

```sql
create policy "service order upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'service-orders' and owner_id = auth.uid());

create policy "service order read" on storage.objects
for select to authenticated
using (bucket_id = 'service-orders' and owner_id = auth.uid());
```

## Desenvolvimento e qualidade

```bash
npm ci
npm run start
npm run typecheck
npm test
npm run build
```
