# WoWHUB

Plataforma full stack para gerenciamento de chamados, tarefas e acompanhamento operacional em ambiente corporativo.

O projeto foi desenvolvido com foco em autenticação, área privada, controle de permissões, gerenciamento de tickets e tarefas, além de uma interface moderna para uso em portfólio.

## Links do projeto

- Frontend: https://wo-whub.vercel.app/
- Backend: https://wowhub.onrender.com

## Demonstração

A aplicação conta com:
- autenticação de usuários
- cadastro e login
- dashboard privada
- gerenciamento de tickets
- gerenciamento de tarefas
- área administrativa com controle por perfil
- integração entre frontend, backend e banco PostgreSQL

## Tecnologias utilizadas

### Frontend
- React
- TypeScript
- Vite
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT
- Bcrypt
- Zod
- CORS

### Banco de dados
- PostgreSQL
- Neon

### Deploy
- Vercel
- Render

## Estrutura do projeto

```bash
WoWHUB/
├── backend
└── frontend


Funcionalidades
Autenticação
cadastro de usuário
login com token JWT
persistência de sessão
controle de acesso por perfil
Tickets
criação de chamados
listagem de tickets
atualização de status
comentários em tickets
prioridade e categoria
Tarefas
criação de tarefas
atribuição para usuários
atualização de status
vinculação com projeto
Administração
área restrita para administradores
gerenciamento de recursos internos
controle de permissões por role
Perfis de acesso

O seed inicial cria dois usuários de teste:

Admin
Email: admin@wowhub.com
Senha: 123456
User
Email: user@wowhub.com
Senha: 123456
Como rodar localmente
1. Clone o repositório
git clone https://github.com/thiagokerbeer/WoWHUB.git
cd WoWHUB
2. Rode o backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev

O backend ficará disponível em:

http://localhost:3333
3. Rode o frontend

Em outro terminal:

cd frontend
npm install
npm run dev

O frontend ficará disponível em:

http://localhost:5173
Variáveis de ambiente
Backend .env
DATABASE_URL="sua_url_do_postgres"
DIRECT_URL="sua_url_direta_do_postgres"
JWT_SECRET="sua_chave_jwt"
FRONTEND_URL="http://localhost:5173"
PORT=3333
Frontend .env
VITE_API_URL=http://localhost:3333
Build de produção
Backend
cd backend
npm run build
npm start
Frontend
cd frontend
npm run build
Deploy
Frontend

Publicado na Vercel:

https://wo-whub.vercel.app/
Backend

Publicado na Render:

https://wowhub.onrender.com
Banco

Hospedado no Neon com PostgreSQL.

Objetivo do projeto

O WoWHUB foi criado como projeto de portfólio para demonstrar capacidade de desenvolver uma aplicação full stack moderna, com:

frontend componentizado
backend com rotas protegidas
autenticação com JWT
validação com Zod
ORM com Prisma
integração com banco relacional
deploy completo em produção
Autor

Thiago Kerber

GitHub: https://github.com/thiagokerbeer
LinkedIn: https://www.linkedin.com/in/thiagokerber/