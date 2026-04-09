<div align="center">

# WoWHUB

**Plataforma de operação interna para gestão de tarefas, chamados e usuários**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)

[**Demo ao vivo →**](https://wo-whub.vercel.app) &nbsp;·&nbsp; [**API →**](https://wowhub.onrender.com/health)

</div>

---

## Sobre o projeto

O **WoWHUB** é uma aplicação SaaS de operação interna construída com arquitetura desacoplada (frontend + backend independentes), autenticação JWT, painel administrativo funcional e interface com acabamento premium.

O projeto foi desenvolvido como portfólio técnico com mentalidade de produto real: não é um CRUD genérico, é uma aplicação com camadas definidas, controle de acesso, regras de negócio e deploy em produção.

---

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Autenticação** | Registro e login com JWT, proteção de rotas, sessão persistida no cliente |
| **Dashboard** | Visão geral da operação com dados do usuário autenticado |
| **Tarefas** | Criação e atualização de status de tarefas operacionais |
| **Chamados** | Abertura, acompanhamento e comentários em chamados internos |
| **Admin** | Painel com ações reais sobre usuários: bloquear, banir, desbanir, excluir |
| **Rate limiting** | Proteção de rotas de auth com Upstash Redis (fallback in-memory) |
| **Turnstile** | Suporte opcional a Cloudflare Turnstile em registro/login |

---

## Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **React Router v6** — roteamento com rotas protegidas e admin-only
- **Axios** — cliente HTTP com interceptors de autenticação e feedback de sessão expirada
- **TanStack React Query v5** — cache e gerenciamento de estado assíncrono
- CSS modular por componente, sem framework de UI externo

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** + **PostgreSQL** (Neon)
- **Zod** — validação de schemas nas rotas
- **JWT** + **bcrypt** — autenticação e hash de senhas
- **Helmet** + **CORS** configurado por allowlist
- **Upstash Redis** (opcional) — rate limiting distribuído para rotas de auth

### Infra / Deploy
| Camada | Plataforma |
|--------|-----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Banco de dados | [Neon](https://neon.tech) (PostgreSQL serverless) |

---

## Arquitetura

```
wowhub/
├── frontend/                  # Vite + React 18
│   └── src/
│       ├── components/        # Componentes reutilizáveis e UI primitives
│       ├── context/           # AuthContext (sessão global)
│       ├── pages/             # Dashboard, Tickets, Tasks, Admin, Auth
│       ├── services/api.ts    # Axios instance + interceptors
│       ├── query/             # React Query client e query keys
│       └── lib/               # Utilitários: env, i18n, formatação
│
└── backend/                   # Express + TypeScript
    └── src/
        ├── routes/            # Definição de rotas por domínio
        ├── controllers/       # Entrada HTTP → chama services
        ├── services/          # Regras de negócio + Prisma
        ├── middlewares/       # Auth, admin, rate limit, logger, erros
        ├── schemas/           # Validação Zod por domínio
        ├── config/            # Env, Prisma client
        └── utils/             # AppError, asyncHandler, JWT, paginação
```

**Padrão de camadas:** `Route → Controller → Service → Prisma`

---

## Rodando localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL acessível (local ou Neon/Supabase/Railway)

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/wowhub.git
cd wowhub
```

### 2. Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` baseado no exemplo:

```bash
cp .env.example .env
```

Preencha as variáveis obrigatórias em `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/wowhub"
JWT_SECRET="um_segredo_forte_com_pelo_menos_32_caracteres"
FRONTEND_URL="http://localhost:5173"
```

Execute as migrations e suba o servidor:

```bash
npx prisma migrate dev
npm run dev
```

A API estará disponível em `http://localhost:3333`.

### 3. Frontend

```bash
cd ../frontend
npm install
```

Crie o arquivo `.env.local`:

```env
VITE_API_URL="http://localhost:3333"
```

Suba o frontend:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## Rotas da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/health` | — | Health check com status do banco |
| `POST` | `/auth/register` | — | Cadastro de usuário |
| `POST` | `/auth/login` | — | Login, retorna JWT |
| `GET` | `/auth/me` | ✓ | Dados do usuário autenticado |
| `GET` | `/dashboard` | ✓ | Resumo operacional |
| `GET` | `/tasks` | ✓ | Listagem de tarefas |
| `POST` | `/tasks` | ✓ | Criar tarefa |
| `PATCH` | `/tasks/:id/status` | ✓ | Atualizar status |
| `GET` | `/tickets` | ✓ | Listagem de chamados |
| `POST` | `/tickets` | ✓ | Abrir chamado |
| `PATCH` | `/tickets/:id/status` | ✓ | Atualizar status |
| `POST` | `/tickets/:id/comments` | ✓ | Comentar em chamado |
| `GET` | `/admin/snapshot` | ✓ Admin | Listagem de usuários |
| `PATCH` | `/admin/users/:id/access` | ✓ Admin | Bloquear / banir / desbanir |
| `DELETE` | `/admin/users/:id` | ✓ Admin | Excluir usuário |

Todas as rotas também estão disponíveis sob o prefixo `/api/v1/`.

---

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✓ | Connection string PostgreSQL |
| `JWT_SECRET` | ✓ | Segredo para assinatura JWT |
| `PORT` | — | Porta do servidor (padrão: `3333`) |
| `FRONTEND_URL` | — | Origin permitida pelo CORS |
| `TURNSTILE_ENABLED` | — | `true` para ativar Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | — | Obrigatória se `TURNSTILE_ENABLED=true` |
| `UPSTASH_REDIS_REST_URL` | — | URL do Upstash (rate limiting distribuído) |
| `UPSTASH_REDIS_REST_TOKEN` | — | Token do Upstash |

### Frontend (`frontend/.env.local`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API (ex.: `https://wowhub.onrender.com`) |

---

## Modelo de dados

```prisma
model User {
  id          String    @id @default(cuid())
  name        String
  email       String    @unique
  role        Role      @default(USER)   // USER | ADMIN
  isBlocked   Boolean   @default(false)
  bannedUntil DateTime?
  // ...tasks, tickets, comments, activityLogs
}

model Task {
  status  TaskStatus   // TODO | IN_PROGRESS | DONE
  priority Priority    // LOW | MEDIUM | HIGH
}

model Ticket {
  status   TicketStatus  // OPEN | IN_PROGRESS | CLOSED
  priority Priority
  comments Comment[]
}
```

---

## Próximas evoluções

- [ ] Dashboard com métricas operacionais (gráficos, KPIs)
- [ ] Paginação e busca de usuários no admin
- [ ] Filtros avançados por status, prioridade e responsável
- [ ] Histórico de ações administrativas (auditoria)
- [ ] Notificações internas
- [ ] Controle de permissões por nível (RBAC expandido)
- [ ] Testes unitários e de integração
- [ ] GitHub Actions CI/CD

---

## Autor

**Thiago Kerber**

Desenvolvedor Full Stack com foco em aplicações web modernas, arquitetura limpa e experiência de produto.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Thiago_Kerber-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/thiago-kerber)
[![GitHub](https://img.shields.io/badge/GitHub-teker-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/teker)
