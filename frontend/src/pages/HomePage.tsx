import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="landing-page">
      <header className="hero-section">
        <nav className="topbar">
          <div className="brand-inline">
            <div className="brand-mark">W</div>
            <span>WoWHUB</span>
          </div>
          <div className="top-actions">
            <Link to="/login" className="link-light">Entrar</Link>
            <Link to="/register" className="button-primary">Começar demo</Link>
          </div>
        </nav>

        <div className="hero-content">
          <div>
            <span className="eyebrow">Projeto 06 • projeto troféu</span>
            <h1>A central de controle que faltava no seu portfólio.</h1>
            <p>
              O WoWHUB é um conceito de plataforma premium para operações internas, focada em suporte,
              projetos, fluxo de tarefas e visibilidade da equipe.
              Foi construído para parecer um produto SaaS real, e não mais um CRUD de sala de aula.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="button-primary">Entrar no hub</Link>
              <Link to="/login" className="button-secondary">Usar acesso demo</Link>
            </div>
          </div>

          <div className="hero-card-grid">
            <article className="floating-card">
              <small>Velocidade de resposta</small>
              <strong>92%</strong>
              <p>Chamados respondidos dentro da meta de SLA.</p>
            </article>
            <article className="floating-card accent">
              <small>Painel ativo</small>
              <strong>24 tarefas</strong>
              <p>Prioridades visíveis para toda a equipe.</p>
            </article>
            <article className="floating-card">
              <small>Pulso executivo</small>
              <strong>6 métricas</strong>
              <p>Uma visão única para operações, suporte e liderança.</p>
            </article>
          </div>
        </div>
      </header>

      <section className="feature-grid">
        <article className="feature-card"><h3>Área privada</h3><p>Autenticação, separação por perfil e rotas protegidas.</p></article>
        <article className="feature-card"><h3>Fluxo de suporte</h3><p>Abertura de chamados, comentários e atualização de status.</p></article>
        <article className="feature-card"><h3>Gestão de tarefas</h3><p>Tarefas ligadas a projetos, responsáveis e andamento.</p></article>
        <article className="feature-card"><h3>Visão admin</h3><p>Usuários, atividades e visão operacional centralizada.</p></article>
      </section>

      <section className="showcase-strip">
        <div>
          <strong>Contas demo prontas</strong>
          <p>Admin: admin@wowhub.com • Usuário: user@wowhub.com • Senha: 123456</p>
        </div>
        <Link to="/login" className="button-primary">Abrir dashboard</Link>
      </section>
    </div>
  );
}
