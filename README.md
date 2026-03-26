# WoWHUB



<p align="center">
  <img src="https://img.shields.io/badge/status-conclu%C3%ADdo-1f8b4c?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-20232A?style=for-the-badge&logo=react" alt="Frontend" />
  <img src="https://img.shields.io/badge/backend-Node.js%20%2B%20Express-3C873A?style=for-the-badge&logo=node.js" alt="Backend" />
  <img src="https://img.shields.io/badge/database-SQLite-003B57?style=for-the-badge&logo=sqlite" alt="Banco de dados" />
  <img src="https://img.shields.io/badge/orm-Prisma-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/auth-JWT-EF4444?style=for-the-badge" alt="JWT" />
  <img src="https://img.shields.io/badge/portf%C3%B3lio-projeto%20trof%C3%A9u-6D28D9?style=for-the-badge" alt="Projeto troféu" />
</p>

<p align="center">
  <strong>Plataforma full stack de gestão operacional interna com autenticação, área privada, tickets, tarefas e painel administrativo.</strong>
</p>

---

## Sobre o projeto

O **WoWHUB** foi desenvolvido como o principal projeto de vitrine do meu portfólio.

A proposta foi construir uma aplicação com aparência de produto real, fluxo multiusuário, autenticação, rotas protegidas, controle de acesso por perfil e organização operacional interna.  
Mais do que um CRUD simples, o WoWHUB foi pensado para demonstrar estrutura de aplicação full stack com foco em contexto corporativo, usabilidade, organização e evolução técnica.

---

## Objetivo

Demonstrar, em um único projeto, minha capacidade de desenvolver uma aplicação full stack com:

- front-end organizado e funcional
- back-end estruturado
- autenticação com sessão persistida
- controle de acesso por perfil
- integração com banco de dados
- separação clara entre áreas pública e privada
- fluxo administrativo
- projeto com apresentação forte para GitHub e portfólio

---

## Funcionalidades

### Área pública
- Landing page institucional
- Apresentação do sistema
- Entrada para login e cadastro

### Autenticação
- Cadastro de usuário
- Login
- Sessão persistida no front-end
- Rotas protegidas
- Controle de acesso por perfil

### Área privada
- Dashboard do usuário
- Navegação autenticada
- Visualização das principais áreas do sistema

### Chamados
- Criação de tickets
- Listagem de chamados
- Visualização de detalhes
- Comentários em chamados
- Organização do fluxo interno

### Tarefas
- Cadastro de tarefas
- Visualização em lista
- Acompanhamento de atividades

### Administração
- Painel administrativo
- Acesso restrito para administrador
- Visão ampliada do sistema
- Estrutura preparada para expansão de métricas e gestão

---

## Stack utilizada

### Front-end
- React
- TypeScript
- Vite
- React Router DOM
- CSS

### Back-end
- Node.js
- Express
- TypeScript

### Banco de dados e ORM
- SQLite
- Prisma

### Autenticação
- JWT

### Ambiente local
- Seed com dados de demonstração
- Estrutura pronta para execução local
- Projeto voltado para exibição no GitHub e portfólio técnico

---

## Estrutura do projeto

```bash
wowhub/
  frontend/
  backend/
  assets/
  README.md


  Como rodar o projeto localmente
1. Clone o repositório
git clone <URL_DO_SEU_REPOSITORIO>
2. Entre na pasta do projeto
cd wowhub
3. Rode o backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
4. Rode o frontend

Em outro terminal:

cd frontend
npm install
npm run dev
Credenciais de demonstração
Administrador
E-mail: admin@wowhub.com
Senha: 123456
Usuário comum
E-mail: user@wowhub.com
Senha: 123456
O que este projeto demonstra

O WoWHUB foi criado para representar um projeto de portfólio com mais profundidade técnica e melhor apresentação visual.

Com ele, demonstro:

construção de aplicação full stack
separação entre frontend e backend
autenticação com token
controle de acesso por perfil
modelagem relacional com Prisma
estruturação por módulos
uso de rotas privadas
organização de fluxo de usuário e administrador
preocupação com apresentação de produto, e não apenas com funcionalidade
Diferenciais no portfólio

Este projeto ocupa o papel de projeto troféu dentro do meu portfólio.

Ele foi pensado para reunir:

qualidade visual
estrutura de sistema real
fluxo completo de uso
organização técnica
contexto mais próximo de produto corporativo

A intenção com o WoWHUB foi mostrar não só que consigo programar, mas que também consigo estruturar uma aplicação com visão de produto, arquitetura e experiência de uso.

Melhorias futuras
Upload de anexos
Métricas reais no dashboard
Filtros avançados por status e prioridade
Notificações internas
Tema dark/light
Auditoria de ações
Deploy completo com banco externo
Painel analítico mais robusto
Responsividade ainda mais refinada
Status do projeto

Concluído como projeto local de portfólio e vitrine técnica para GitHub.

Autor

Thiago Kerber