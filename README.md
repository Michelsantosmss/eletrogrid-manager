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

## Desenvolvimento e qualidade

```bash
npm ci
npm run start
npm run typecheck
npm test
npm run build
```
