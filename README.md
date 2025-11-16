<div align="center">
	<img src="public/logo-sem-nome-branca.png" alt="Xwitter Logo" width="160"/>
</div>

# 🐦 Xwitter - Frontend

Interface web do Xwitter, construída com **Next.js 16** e **React 19** para entregar uma experiência rica, responsiva e acessível. O frontend consome a API do backend Xwitter, disponível em [Xwitter-Social/backend-xwitter](https://github.com/Xwitter-Social/backend-xwitter), e implementa as principais interações de uma rede social moderna: timeline em tempo real, curtidas, reposts, comentários, mensagens privadas, busca e gerenciamento de perfil.

> 🔗 **Backend**: https://github.com/Xwitter-Social/backend-xwitter

---

## 🚀 Sobre o Projeto

- **App Router + Server Actions** do Next.js 16 para renderização híbrida e navegação fluída.
- **SWR** para busca e cache de dados com revalidação automática.
- **Tailwind CSS** e componentes reutilizáveis para garantir consistência visual.
- **Autenticação baseada em cookies HTTP-only**, com proteção de rotas no cliente.
- Fluxos completos de interação social: seguir usuários, publicar, curtir, repostar, comentar e gerenciar conta.

---

## 🛠️ Tecnologias Principais

- **[Next.js 16](https://nextjs.org/)** – meta-framework React com App Router.
- **[React 19](https://react.dev/)** – biblioteca para construção de interfaces.
- **[TypeScript](https://www.typescriptlang.org/)** – tipagem estática e DX aprimorada.
- **[SWR](https://swr.vercel.app/)** – data fetching com cache otimista.
- **[Tailwind CSS](https://tailwindcss.com/)** – estilização utilitária.
- **[Radix UI](https://www.radix-ui.com/)** – primitives acessíveis para componentes complexos.
- **[Cypress 15](https://www.cypress.io/)** – testes end-to-end.

---

## 📦 Estrutura do Projeto

```
frontend-twitter/
├── app/
│   ├── (rotas públicas e protegidas)
│   ├── api/                 # Rotas Next.js que fazem proxy para o backend
│   └── layout.tsx           # Layout raiz com providers
├── components/              # UI compartilhada e componentes de domínio
├── hooks/                   # Hooks de dados (SWR) e utilidades
├── lib/                     # Clientes HTTP e helpers
├── public/                  # Assets estáticos
├── cypress/                 # Configuração e specs e2e
├── eslint.config.mjs        # Regras de lint
├── next.config.ts           # Configuração do Next.js
├── package.json
└── README.md
```

---

## 📋 Quadro Kanban

[Acesse o Quadro Kanban para acompanhar o desenvolvimento histórias de usuário.](https://github.com/orgs/Xwitter-Social/projects/2)

---

## ✅ Pré-requisitos

Certifique-se de ter instalado em sua máquina:

- [Node.js 20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (ou pnpm/bun, se preferir)
- Backend Xwitter em execução (executar [backend-xwitter](https://github.com/Xwitter-Social/backend-xwitter))

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# URL da API do backend (exposta pelo NestJS)
BACKEND_API_URL=http://localhost:3001
```

```bash
# Sugestão: copie o arquivo de exemplo e ajuste conforme necessário
cp .env.local.example .env.local
```

> ⚠️ O frontend utiliza cookies HTTP-only para autenticação: execute o backend na mesma origem base (host) ou configure `NEXT_PUBLIC`/CORS conforme necessário.

---

## 🏃‍♂️ Executando o Projeto

```bash
# 0. Clone o repositório
git clone https://github.com/Xwitter-Social/frontend-xwitter.git
cd frontend-xwitter

# 1. Instale as dependências
npm install

# 2. Execute o servidor de desenvolvimento
npm run dev

# 3. Acesse a aplicação
http://localhost:3000
```

- O login e fluxos sociais exigem que o backend esteja rodando em `BACKEND_API_URL`.
- O App Router do Next.js recarrega automaticamente as páginas durante o desenvolvimento.

### Build de Produção

```bash
npm run build
npm run start

# ou use
npm run lint   # valida o código antes do build
```

---

## 🧪 Testes End-to-End (Cypress)

O projeto possui uma suíte **E2E** que cobre o fluxo completo do usuário (cadastro, login, interações sociais e exclusão de conta).

### Pré-requisitos

- Backend disponível.
- Aplicação frontend rodando em `http://localhost:3000` (ou defina `CYPRESS_BASE_URL`).

### Executando os testes

```bash
# Abrir Cypress em modo interativo
npm run cy:open

# Rodar em modo headless (CI)
npm run cy:run
```

Os testes utilizam `cy.request` para criar seeds e limpar dados diretamente na API, garantindo isolamento entre execuções.

---

## 🤝 Guia de Contribuição

### 🚦 Política de Branches

- Mantenha a branch `develop` atualizada localmente (`git checkout develop && git pull`).
- Crie branches de trabalho a partir de `develop` usando prefixos descritivos (`feature/`, `fix/`, `chore/`...).
- Abra pull requests de `develop` para `main`. PRs direcionados à `main` exigem pelo menos uma aprovação antes do merge.
- Evite commits diretos em `main`.

### 1. Fluxo Básico

```bash
git clone https://github.com/Xwitter-Social/frontend-xwitter.git
cd frontend-xwitter
npm install
npm run dev
# crie uma branch feat/minha-feature
```

### 2. Convenções de Commit

Adotamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona novo componente de timeline
fix: corrige erro no hook useTimeline
docs: atualiza README com instruções de testes
refactor: reorganiza componentes de navegação
test: adiciona cobertura para fluxo de login
chore: atualiza dependências
```

### 3. Lint e Formatação

```bash
npm run lint     # valida o código (ESLint)
npm run format   # aplica Prettier
```

### 4. Atualização de Dependências

```bash
npm install pacote@versao

# após instalar, valide o lint e o build
npm run lint
npm run build
```

### 5. Pull Requests

- Cubra alterações com testes (unitários ou E2E) quando aplicável.
- Atualize a documentação (README, comentários) quando necessário.
- Garanta que `npm run lint` e `npm run build` estão passando.
- Explique no PR o contexto da mudança e passos para validar.

### ✅ Integração Contínua

Pull requests direcionados à branch `main` disparam o workflow [`frontend-ci`](.github/workflows/frontend-ci.yml). O pipeline executa:

- `npm run lint` para validar o código;
- `npm run build` para garantir que a aplicação compila.

> 💡 O pipeline é obrigatório para merges na `main`. Execute os scripts localmente antes de abrir o PR e acompanhe os checks no GitHub.

