# WoWHUB

Plataforma web para operação interna, organização de demandas e gestão centralizada de usuários, tarefas e chamados.

O **WoWHUB** foi projetado com proposta de produto real de mercado: uma aplicação SaaS com foco em fluxo operacional, visibilidade gerencial, controle administrativo e experiência moderna de uso.  
A estrutura do projeto combina frontend e backend desacoplados, autenticação, painel administrativo e interface construída para parecer software profissional.

---

## Visão geral

Em muitos times, o fluxo operacional se perde entre mensagens, planilhas e ferramentas desconectadas. O WoWHUB nasce para resolver esse cenário com uma plataforma única para acompanhamento de atividades, organização do ambiente interno e centralização do controle da operação.

A aplicação foi construída com foco em:

- gestão visual e clara da operação
- organização de tarefas e chamados
- controle de acesso de usuários
- painel administrativo com ações reais
- base escalável para evolução de produto SaaS

---

## Principais funcionalidades

### Painel operacional
- visualização central da operação
- interface organizada para navegação entre áreas do sistema
- experiência pensada para uso diário

### Gestão de tarefas e demandas
- estrutura voltada para organização de rotinas internas
- base preparada para acompanhamento de atividades operacionais
- visão centralizada para produtividade e controle

### Gestão de chamados
- ambiente voltado para fluxo de suporte e operação
- estrutura de software com mentalidade de produto interno/externo
- possibilidade de expansão para regras de prioridade, status e histórico

### Autenticação e área privada
- acesso autenticado para usuários
- separação entre área pública e ambiente restrito
- base preparada para regras de permissão e controle por perfil

### Administração de usuários
O painel administrativo já conta com ações funcionais integradas ao backend:

- bloquear usuário
- desbloquear usuário
- aplicar banimento temporário de **5 dias**
- aplicar banimento temporário de **30 dias**
- remover banimento
- excluir usuário

### Feedback visual de ação
- respostas visuais no fluxo administrativo
- experiência mais clara para ações críticas
- interface polida para transmitir sensação de produto premium

---

## Diferenciais do projeto

- arquitetura separada entre frontend e backend
- interface premium com foco em percepção de produto real
- integração completa entre camada visual e regras administrativas
- uso de banco PostgreSQL com Prisma ORM
- deploy em ambiente real com frontend na **Vercel** e backend na **Render**
- modelagem preparada para crescimento do sistema

---

## Stack utilizada

### Frontend
- **React**
- **TypeScript**
- **Vite**

### Backend
- **Node.js**
- **Express**
- **TypeScript**

### Banco e ORM
- **PostgreSQL**
- **Prisma**

### Infra e deploy
- **Neon** para banco de dados PostgreSQL
- **Vercel** para deploy do frontend
- **Render** para deploy do backend

---
## Acesse a demonstração

Veja o WoWHUB em funcionamento nos links abaixo.

### Aplicação web
(https://wo-whub.vercel.app)

### API / backend
(https://wowhub.onrender.com)


## Arquitetura do projeto

O projeto está organizado em duas aplicações principais:

```bash
wowhub/
  frontend/
  backend/

  Frontend

Responsável por:

interface do usuário
navegação entre páginas
consumo da API
fluxo visual do painel
experiência administrativa
Backend

Responsável por:

regras de negócio
autenticação e proteção de rotas
gerenciamento de usuários
ações administrativas
integração com banco de dados via Prisma
Funcionalidades administrativas já implementadas

O WoWHUB já possui uma área administrativa funcional conectada ao backend com suporte para:

listagem de usuários
controle de status de acesso
bloqueio e desbloqueio
banimentos temporários
remoção de banimentos
exclusão de usuários

Campos já existentes no modelo de usuário:

isBlocked
bannedUntil

Esses campos permitem ampliar facilmente a camada de governança e segurança da aplicação em futuras evoluções.

Experiência visual

O frontend do WoWHUB foi trabalhado para transmitir sensação de plataforma profissional.
A proposta visual busca um resultado mais próximo de software comercial moderno, com:

layout limpo
contraste elegante
hierarquia visual clara
componentes com acabamento mais premium
páginas administrativas com feedback de ação
linguagem visual coerente entre autenticação, painel e gestão
Como executar o projeto localmente
1) Clonar o repositório
git clone <URL_DO_SEU_REPOSITORIO>
cd wowhub
2) Rodar o backend
Caminho

backend

Instalar dependências
cd backend
npm install
Configurar variáveis de ambiente

Crie um arquivo .env dentro de backend/ com a URL do banco PostgreSQL:

DATABASE_URL="sua_database_url"
DIRECT_URL="sua_direct_url"
JWT_SECRET="seu_segredo_jwt"

Observação: os nomes das variáveis podem variar conforme sua implementação atual.
Mantenha exatamente os nomes usados no seu projeto.

Gerar Prisma Client
npx prisma generate
Rodar migrations
npx prisma migrate dev
Subir backend em desenvolvimento
npm run dev
Build do backend
npm run build
3) Rodar o frontend
Caminho

frontend

Instalar dependências
cd ../frontend
npm install
Configurar variáveis de ambiente

Crie um arquivo .env dentro de frontend/ com a URL da API:

VITE_API_URL="http://localhost:PORTA_DA_API"
Rodar frontend em desenvolvimento
npm run dev
Build do frontend
npm run build
Fluxo de funcionamento
o usuário acessa a aplicação
realiza autenticação
entra na área privada da plataforma
interage com os módulos do sistema
administradores podem gerenciar usuários através da AdminPage
o backend processa regras e persiste os dados no PostgreSQL via Prisma
Objetivo do projeto

O WoWHUB foi desenvolvido como peça de portfólio com padrão superior de apresentação, estrutura técnica consistente e proposta real de produto.

Mais do que demonstrar layout, o projeto busca mostrar capacidade de construir uma aplicação com:

separação entre camadas
integração real frontend/backend
modelagem de dados
controle administrativo
deploy
refinamento visual
organização de código
pensamento de produto
Status atual
Concluído
estrutura base do projeto
frontend com identidade visual trabalhada
backend funcional
integração entre frontend e backend
área administrativa operacional
ações administrativas de usuário funcionando
melhorias visuais na AdminPage
build do backend funcionando com npm run build
Em evolução
refinamento final de documentação
fortalecimento da apresentação para portfólio
próximas expansões funcionais do sistema
Próximas possibilidades de evolução
controle por níveis de permissão
histórico de ações administrativas
filtros avançados por status de usuário
gestão completa de chamados com prioridade e SLA
dashboard com métricas operacionais
notificações internas
auditoria de ações
paginação e busca de usuários
melhoria de segurança e observabilidade
Aprendizados aplicados no projeto

Durante a construção do WoWHUB, foram trabalhados na prática conceitos importantes de desenvolvimento full stack, como:

criação de aplicação com frontend e backend separados
integração entre API e interface
modelagem com Prisma
uso de PostgreSQL em ambiente real
deploy de aplicações em plataformas diferentes
tratamento de regras administrativas
polimento visual com foco em percepção de qualidade
organização de projeto para portfólio técnico

Desenvolvido por

Thiago Kerber

Desenvolvedor Full Stack em construção de portfólio com foco em aplicações web modernas, experiência prática com React, TypeScript, Node.js, Express, Prisma e PostgreSQL.

Observação final

O WoWHUB representa uma aplicação construída com mentalidade de produto real: organização técnica, camada administrativa funcional, integração completa e preocupação visual acima do padrão comum de projeto acadêmico.

Este projeto foi desenvolvido como vitrine técnica para demonstrar capacidade de construir software com estrutura, acabamento e potencial de evolução.
