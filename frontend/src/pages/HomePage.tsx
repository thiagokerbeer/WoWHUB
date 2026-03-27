import { Link, Navigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { InteractiveBackground } from "../components/InteractiveBackground";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-screen app-background">
        <InteractiveBackground />
        <div className="loading-screen-card">Carregando WoWHUB...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="landing-page app-background">
      <InteractiveBackground />
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <header className="topbar hero-shell">
        <BrandLogo subtitle="Ops SaaS Platform" />

        <div className="top-actions">
          <Link to="/login" className="link-light">
            Entrar
          </Link>

          <Link to="/register" className="button-primary">
            Começar demo
          </Link>
        </div>
      </header>

      <main className="hero-section hero-shell">
        <section className="hero-content">
          <div>
            <span className="eyebrow">Plataforma SaaS para operações internas</span>

            <h1>A central de controle que faltava no seu negócio.</h1>

            <p className="hero-lead">
              O WoWHUB reúne suporte, tarefas, indicadores e visibilidade operacional
              em uma única plataforma. Uma experiência com cara de SaaS real para
              equipes que precisam organizar demandas, acelerar respostas e operar com
              mais clareza.
            </p>

            <div className="hero-selling-points">
              <div className="hero-selling-card">
                <strong>Menos ruído</strong>
                <span>
                  Tickets, tarefas e fluxo operacional centralizados em um só lugar.
                </span>
              </div>

              <div className="hero-selling-card">
                <strong>Mais controle</strong>
                <span>
                  Prioridades, responsáveis e andamento visíveis para toda a equipe.
                </span>
              </div>

              <div className="hero-selling-card">
                <strong>Cara de produto</strong>
                <span>
                  Interface pensada para parecer uma plataforma SaaS pronta para o mercado.
                </span>
              </div>
            </div>

            <div className="hero-buttons">
              <Link to="/login" className="button-primary">
                Entrar no hub
              </Link>

              <Link to="/register" className="button-secondary">
                Usar acesso demo
              </Link>
            </div>
          </div>

          <div className="hero-card-grid">
            <article className="floating-card">
              <span className="eyebrow">Velocidade de resposta</span>
              <strong>92%</strong>
              <p>Chamados respondidos dentro da meta de SLA.</p>
            </article>

            <article className="floating-card accent">
              <span className="eyebrow">Painel ativo</span>
              <strong>24 tarefas</strong>
              <p>Prioridades visíveis para toda a equipe.</p>
            </article>

            <article className="floating-card">
              <span className="eyebrow">Pulso executivo</span>
              <strong>6 métricas</strong>
              <p>Uma visão única para operações, suporte e liderança.</p>
            </article>
          </div>
        </section>

        <section className="feature-grid">
          <article className="feature-card">
            <span className="feature-kicker">Área privada</span>
            <h3>Autenticação e controle por perfil</h3>
            <p>
              Rotas protegidas, experiência separada por nível de acesso e navegação
              segura dentro do produto.
            </p>
          </article>

          <article className="feature-card">
            <span className="feature-kicker">Suporte operacional</span>
            <h3>Chamados com histórico e status</h3>
            <p>
              Registre demandas, acompanhe comentários e mantenha a operação andando
              sem perder contexto.
            </p>
          </article>

          <article className="feature-card">
            <span className="feature-kicker">Execução</span>
            <h3>Tarefas ligadas a projeto e responsável</h3>
            <p>
              Transforme demanda em ação com responsáveis definidos, progresso visível
              e foco no que importa.
            </p>
          </article>

          <article className="feature-card">
            <span className="feature-kicker">Gestão</span>
            <h3>Visão consolidada da operação</h3>
            <p>
              Liderança, suporte e equipe olhando para o mesmo painel, sem planilhas
              perdidas no nevoeiro.
            </p>
          </article>
        </section>

        <section className="showcase-strip">
          <div>
            <span className="eyebrow">Acesso rápido</span>
            <h3>Explore a aplicação agora com contas prontas</h3>
            <p className="muted-line">
              Admin: admin@wowhub.com • Usuário: user@wowhub.com • Senha: 123456
            </p>
          </div>

          <Link to="/login" className="button-primary">
            Abrir dashboard
          </Link>
        </section>
      </main>
    </div>
  );
}