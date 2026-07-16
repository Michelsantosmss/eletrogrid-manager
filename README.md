# EletroGrid Manager

Sistema web em português (Brasil) para assistência técnica da ELETROGRID, cobrindo eletrônicos, energia solar e serviços elétricos.

## Funcionalidades

- Login e cadastro com Firebase Authentication, além de modo demonstração local.
- Dashboard responsivo com menu lateral e indicadores operacionais.
- Cadastro, pesquisa e exclusão de clientes e equipamentos.
- Ordens de serviço com entrada, saída, status e histórico completo.
- Orçamentos automáticos e conversão em contas a receber.
- Financeiro com contas a receber, contas a pagar e fluxo de caixa.
- Estrutura preparada para Cloud Firestore, Firebase Storage e Firebase Hosting.

## Variáveis de ambiente

Crie um arquivo `.env` com as chaves do seu projeto Firebase:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Desenvolvimento

```bash
npm ci
npm run start
```

## Qualidade

```bash
npm run typecheck
npm test
npm run build
```

## Deploy Firebase Hosting

```bash
npm run build
firebase deploy
```

## Coleções Firestore

- `clients`
- `equipment`
- `serviceOrders`
- `quotes`
- `finance`

As regras de segurança exigem usuário autenticado para leitura e escrita.
