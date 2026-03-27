import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { Task } from "../types";
import { useAuth } from "../context/AuthContext";
import "./TasksPage.css";

const initialForm = {
  title: "",
  description: "",
  projectId: "wowhub-project-core",
  status: "TODO",
  assigneeId: "",
};

function traduzirStatus(status: string) {
  const mapa: Record<string, string> = {
    TODO: "A fazer",
    DOING: "Em execução",
    DONE: "Concluída",
  };

  return mapa[status] || status;
}

function formatarData(dateString?: string | null) {
  if (!dateString) {
    return "Sem prazo";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function TasksPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadTasks() {
    setLoading(true);

    try {
      const response = await api.get<Task[]>("/tasks");
      setTasks(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const metricas = useMemo(() => {
    const todo = tasks.filter((task) => task.status === "TODO").length;
    const doing = tasks.filter((task) => task.status === "DOING").length;
    const done = tasks.filter((task) => task.status === "DONE").length;

    return { todo, doing, done };
  }, [tasks]);

  const tarefasFiltradas = useMemo(() => {
    return tasks.filter((task) => {
      const bateBusca =
        search.trim() === "" ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase()) ||
        task.project.name.toLowerCase().includes(search.toLowerCase()) ||
        task.createdBy.name.toLowerCase().includes(search.toLowerCase()) ||
        (task.assignee?.name || "").toLowerCase().includes(search.toLowerCase());

      const bateStatus = statusFilter === "ALL" || task.status === statusFilter;

      return bateBusca && bateStatus;
    });
  }, [tasks, search, statusFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);

      await api.post("/tasks", {
        ...form,
        assigneeId: form.assigneeId.trim() || null,
      });

      setForm(initialForm);
      await loadTasks();
    } finally {
      setCreating(false);
    }
  }

  async function changeStatus(taskId: string, status: string) {
    try {
      setActiveTaskId(taskId);
      await api.patch(`/tasks/${taskId}/status`, { status });
      await loadTasks();
    } finally {
      setActiveTaskId(null);
    }
  }

  return (
    <div className="page-stack tasks-page">
      <section className="header-card wow-gradient tasks-hero">
        <div className="tasks-hero__content">
          <span className="eyebrow">Trilha de execução</span>
          <h1>Tarefas</h1>
          <p className="tasks-hero__lead">
            Coordene execução, acompanhe responsáveis e mantenha a operação andando com leitura clara de status.
          </p>

          <div className="tasks-hero__chips">
            <span className="tasks-chip">Fluxo de execução</span>
            <span className="tasks-chip">Acompanhamento por status</span>
            <span className="tasks-chip">Organização por projeto</span>
          </div>
        </div>

        <aside className="tasks-hero__summary">
          <div className="tasks-summary-card">
            <span className="tasks-summary-card__label">Leitura rápida da execução</span>

            <div className="tasks-summary-card__grid">
              <div>
                <small>A fazer</small>
                <strong>{metricas.todo}</strong>
              </div>
              <div>
                <small>Em execução</small>
                <strong>{metricas.doing}</strong>
              </div>
              <div>
                <small>Concluídas</small>
                <strong>{metricas.done}</strong>
              </div>
              <div>
                <small>Total</small>
                <strong>{tasks.length}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="tasks-layout">
        {user?.role === "ADMIN" && (
          <aside className="panel-card tasks-create-card">
            <div className="tasks-create-card__header">
              <span className="eyebrow">Nova tarefa</span>
              <h2>Criar item de execução</h2>
              <p className="body-copy">
                Registre a atividade com contexto suficiente para orientar quem vai executar.
              </p>
            </div>

            <form className="tasks-form" onSubmit={handleCreate}>
              <label>
                Título
                <input
                  value={form.title}
                  onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                  placeholder="Ex.: Ajustar onboarding do cliente"
                  required
                />
              </label>

              <label>
                Descrição
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, description: e.target.value }))
                  }
                  placeholder="Descreva o objetivo da tarefa e o contexto esperado"
                  rows={5}
                  required
                />
              </label>

              <div className="tasks-form__split">
                <label>
                  ID do projeto
                  <input
                    value={form.projectId}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, projectId: e.target.value }))
                    }
                    placeholder="wowhub-project-core"
                    required
                  />
                </label>

                <label>
                  Status inicial
                  <select
                    value={form.status}
                    onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
                  >
                    <option value="TODO">A fazer</option>
                    <option value="DOING">Em execução</option>
                    <option value="DONE">Concluída</option>
                  </select>
                </label>
              </div>

              <label>
                ID do responsável
                <input
                  value={form.assigneeId}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, assigneeId: e.target.value }))
                  }
                  placeholder="Opcional"
                />
              </label>

              <button className="button-primary tasks-submit-button" disabled={creating}>
                {creating ? "Criando tarefa..." : "Criar tarefa"}
              </button>
            </form>
          </aside>
        )}

        <section className="page-stack tasks-main-column">
          <div className="panel-card tasks-filter-card">
            <div className="tasks-filter-card__header">
              <div>
                <span className="eyebrow">Painel de execução</span>
                <h2>Fila de tarefas</h2>
              </div>
              <span className="tasks-filter-card__count">
                {tarefasFiltradas.length} {tarefasFiltradas.length === 1 ? "item" : "itens"}
              </span>
            </div>

            <div className="tasks-filters">
              <label className="tasks-filters__search">
                Buscar
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Título, projeto, responsável ou descrição"
                />
              </label>

              <label>
                Status
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  <option value="TODO">A fazer</option>
                  <option value="DOING">Em execução</option>
                  <option value="DONE">Concluída</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="panel-card">Carregando tarefas...</div>
          ) : tarefasFiltradas.length === 0 ? (
            <div className="panel-card tasks-empty-state">
              <span className="eyebrow">Sem itens</span>
              <h2>Nenhuma tarefa encontrada</h2>
              <p className="body-copy">
                Ajuste os filtros ou crie uma nova tarefa para iniciar o fluxo de execução.
              </p>
            </div>
          ) : (
            <div className="page-stack tasks-list">
              {tarefasFiltradas.map((task) => (
                <article className="panel-card task-card" key={task.id}>
                  <div className="task-card__header">
                    <div className="task-card__title-block">
                      <div className="task-card__title-row">
                        <h2>{task.title}</h2>
                        <span className="task-card__date">{formatarData(task.dueDate)}</span>
                      </div>

                      <p className="task-card__meta">
                        {task.project.name} • Criado por {task.createdBy.name}
                      </p>
                    </div>

                    <div className="task-card__badges">
                      <span className={`pill neutral pill-${task.status.toLowerCase()}`}>
                        {traduzirStatus(task.status)}
                      </span>
                    </div>
                  </div>

                  <p className="task-card__description">{task.description}</p>

                  <div className="task-card__details">
                    <div className="task-card__detail">
                      <small>Responsável</small>
                      <strong>{task.assignee?.name || "Sem responsável"}</strong>
                    </div>

                    <div className="task-card__detail">
                      <small>Projeto</small>
                      <strong>{task.project.name}</strong>
                    </div>

                    <div className="task-card__detail">
                      <small>Prazo</small>
                      <strong>{formatarData(task.dueDate)}</strong>
                    </div>
                  </div>

                  <div className="task-card__actions">
                    <button
                      className="small-button"
                      disabled={activeTaskId === task.id}
                      onClick={() => changeStatus(task.id, "TODO")}
                    >
                      A fazer
                    </button>

                    <button
                      className="small-button"
                      disabled={activeTaskId === task.id}
                      onClick={() => changeStatus(task.id, "DOING")}
                    >
                      Em execução
                    </button>

                    <button
                      className="small-button"
                      disabled={activeTaskId === task.id}
                      onClick={() => changeStatus(task.id, "DONE")}
                    >
                      Concluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}