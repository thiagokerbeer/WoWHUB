import { Link, Navigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { InteractiveBackground } from "../components/InteractiveBackground";
import { useAuth } from "../context/AuthContext";

const heroSignals = [
  {
    title: "Fila mais saudável",
    description:
      "Tickets, tarefas e prioridades organizados em um fluxo que reduz ruído operacional.",
  },
  {
    title: "Leitura gerencial clara",
    description:
      "Acompanhe volume, status e andamento sem depender de planilha espalhada na operação.",
  },
  {
    title: "Produto com presença",
    description:
      "Visual premium, área privada e narrativa de software em uso diário, não de tela solta.",
  },
];

const heroMetrics = [
  {
    eyebrow: "SLA compliance • 30 dias",
    value: "98.4%",
    description:
      "Visão demonstrativa de cumprimento operacional para tickets e atendimento interno.",
  },
  {
    eyebrow: "Median first reply",
    value: "11 min",
    description:
      "Indicador comum em service desks para acompanhar a velocidade do primeiro retorno.",
  },
  {
    eyebrow: "First resolution",
    value: "2.6 h",
    description:
      "Métrica útil para medir a eficiência da primeira resolução no fluxo de suporte.",
  },
  {
    eyebrow: "MTTR operacional",
    value: "1.4 h",
    description:
      "Tempo médio de recuperação usado como referência em times de operação e tecnologia.",
  },
];

const productModules = [
  {
    kicker: "Dashboard",
    title: "Leitura rápida do que importa",
    description:
      "Métricas operacionais, atividade recente e resumo visual para liderança e acompanhamento diário.",
  },
  {
    kicker: "Tickets",
    title: "Suporte com histórico e contexto",
    description:
      "Abertura de chamados, comentários, prioridade e evolução de status em um fluxo único.",
  },
  {
    kicker: "Tasks",
    title: "Execução ligada a projeto e dono",
    description:
      "Tarefas com responsável, andamento e vínculo operacional para transformar demanda em ação.",
  },
  {
    kicker: "Admin",
    title: "Governança com ações reais",
    description:
      "Controle de usuários, snapshot administrativo e ferramentas para manter a operação em ordem.",
  },
];

const operatingLayers = [
  {
    kicker: "Acordos e ritmo",
    title: "SLA, resposta e resolução na mesma conversa",
    description:
      "A landing agora fala a língua de produto operacional maduro, com foco em indicadores de rotina.",
  },
  {
    kicker: "Colaboração",
    title: "Tickets e tarefas com menos atrito",
    description:
      "Equipe, suporte e liderança trabalhando sobre a mesma base, sem contexto quebrado entre áreas.",
  },
  {
    kicker: "Visibilidade",
    title: "Painel com leitura de fila e prioridade",
    description:
      "O sistema foi apresentado como uma central viva de operação, não como vitrine genérica.",
  },
  {
    kicker: "Governança",
    title: "Acesso admin fora da vitrine pública",
    description:
      "A conta administrativa deixa de ficar escancarada na entrada e passa a viver só na documentação.",
  },
];

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
            Criar conta
          </Link>
        </div>
      </header>

      <main className="hero-section hero-shell">
        <section className="hero-content">
          <div>
            <span className="eyebrow">
              Service desk, tarefas e governança operacional
            </span>

            <h1>Uma central de operação com cara de produto em produção.</h1>

            <p className="hero-lead">
              O WoWHUB reúne suporte, execução e leitura gerencial em uma única
              plataforma. A proposta é simples: parecer um software que já roda
              no dia a dia de uma operação, com fluxo claro, área privada,
              indicadores e experiência consistente.
            </p>

            <p className="body-copy">
              Em vez de vender só “features”, a landing passa a comunicar o que
              times maduros realmente acompanham: SLA, velocidade de resposta,
              resolução, fila ativa, prioridades e governança de acesso.
            </p>

            <div className="hero-selling-points">
              {heroSignals.map((signal) => (
                <div key={signal.title} className="hero-selling-card">
                  <strong>{signal.title}</strong>
                  <span>{signal.description}</span>
                </div>
              ))}
            </div>

            <div className="hero-buttons">
              <Link to="/register" className="button-primary">
                Criar conta e explorar
              </Link>

              <Link to="/login" className="button-secondary">
                Entrar na área privada
              </Link>
            </div>
          </div>

          <div className="hero-card-grid">
            {heroMetrics.map((metric, index) => (
              <article
                key={metric.eyebrow}
                className={`floating-card ${index === 1 ? "accent" : ""}`}
              >
                <span className="eyebrow">{metric.eyebrow}</span>
                <strong>{metric.value}</strong>
                <p>{metric.description}</p>
              </article>
            ))}

            <p className="muted-line">
              Snapshot demonstrativo inspirado em indicadores usados em service
              management e operações modernas.
            </p>
          </div>
        </section>

        <section className="feature-grid">
          {productModules.map((module) => (
            <article key={module.title} className="feature-card">
              <span className="feature-kicker">{module.kicker}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </section>

        <section className="showcase-strip">
          <div>
            <span className="eyebrow">Narrativa de produto mais madura</span>
            <h3>Menos “CRUD de demonstração”, mais plataforma de operação.</h3>
            <p className="muted-line">
              A home foi reposicionada para parecer software em uso contínuo,
              com linguagem de fila, SLA, governança e execução, não só uma
              página bonita com botão de login.
            </p>
          </div>

          <Link to="/register" className="button-primary">
            Testar agora
          </Link>
        </section>

        <section className="feature-grid">
          {operatingLayers.map((layer) => (
            <article key={layer.title} className="feature-card">
              <span className="feature-kicker">{layer.kicker}</span>
              <h3>{layer.title}</h3>
              <p>{layer.description}</p>
            </article>
          ))}
        </section>

        <section className="showcase-strip">
          <div>
            <span className="eyebrow">Fluxo público mais limpo</span>
            <h3>
              Quem entra na demo cai na Home, cria a própria conta e explora o
              produto com mais naturalidade.
            </h3>
            <p className="muted-line">
              O acesso administrativo não fica mais exposto na vitrine pública.
              Para revisão técnica dos privilégios admin, use a documentação da
              demo.
            </p>
          </div>

          <div className="top-actions">
            <Link to="/login" className="button-secondary">
              Entrar
            </Link>

            <Link to="/register" className="button-primary">
              Começar
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}