import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { AdminSnapshot, AdminUser, Task } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  EmptyState,
  Field,
  FormRow,
  Input,
  NoticeBanner,
  PageHero,
  PanelCard,
  Select,
  SkeletonBlock,
  StatCard,
  StatusBadge,
  Textarea,
} from "../components/ui";
import "./TasksPage.css";

type TaskStatus = "TODO" | "DOING" | "DONE";
type NoticeState =
  | {
      type: "success" | "error";
      title: string;
      message: string;
    }
  | null;

type TaskFormState = {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  assigneeId: string;
};

const initialForm: TaskFormState = {
  title: "",
  description: "",
  projectId: "",
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

function getTaskHealth(todo: number, doing: number, done: number) {
  const total = todo + doing + done;

  if (total === 0) {
    return {
      label: "Fluxo vazio",
      tone: "neutral" as const,
      text: "Ainda não há tarefas registradas na operação.",
    };
  }

  if (doing > todo && doing >= done) {
    return {
      label: "Execução aquecida",
      tone: "info" as const,
      text: "O maior volume está em andamento neste momento.",
    };
  }

  if (done >= todo + doing) {
    return {
      label: "Entrega estável",
      tone: "success" as const,
      text: "A maior parte do fluxo está concluída.",
    };
  }

  return {
    label: "Fila em formação",
    tone: "warning" as const,
    text: "Há acúmulo de itens esperando execução.",
  };
}

function buildErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    const message = response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function mapStatusTone(status: string) {
  const mapa: Record<string, "success" | "warning" | "info" | "neutral"> = {
    TODO: "warning",
    DOING: "info",
    DONE: "success",
  };

  return mapa[status] || "neutral";
}

export function TasksPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminProjects, setAdminProjects] = useState<AdminSnapshot["projects"]>(
    []
  );

  async function loadTasks(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get<Task[]>("/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao carregar tarefas",
        message: buildErrorMessage(
          error,
          "Não foi possível buscar a fila de tarefas agora."
        ),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadAdminSupportData() {
    if (user?.role !== "ADMIN") {
      return;
    }

    try {
      const response = await api.get<AdminSnapshot>("/admin/snapshot");
      setAdminProjects(response.data.projects ?? []);
      setAdminUsers(response.data.users ?? []);

      setForm((current) => ({
        ...current,
        projectId: current.projectId || response.data.projects?.[0]?.id || "",
      }));
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao carregar dados auxiliares",
        message:
          "Não foi possível carregar projetos e responsáveis para criação de tarefas.",
      });
    }
  }

  useEffect(() => {
    loadTasks();
    loadAdminSupportData();
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const metricas = useMemo(() => {
    const todo = tasks.filter((task) => task.status === "TODO").length;
    const doing = tasks.filter((task) => task.status === "DOING").length;
    const done = tasks.filter((task) => task.status === "DONE").length;

    return {
      todo,
      doing,
      done,
      total: tasks.length,
      health: getTaskHealth(todo, doing, done),
    };
  }, [tasks]);

  const tarefasFiltradas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const bateBusca =
        normalizedSearch === "" ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description.toLowerCase().includes(normalizedSearch) ||
        task.project.name.toLowerCase().includes(normalizedSearch) ||
        task.createdBy.name.toLowerCase().includes(normalizedSearch) ||
        (task.assignee?.name || "").toLowerCase().includes(normalizedSearch);

      const bateStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      return bateBusca && bateStatus;
    });
  }, [tasks, search, statusFilter]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    if (!form.projectId.trim()) {
      setNotice({
        type: "error",
        title: "Projeto obrigatório",
        message: "Selecione um projeto para criar a tarefa.",
      });
      return;
    }

    try {
      setCreating(true);

      await api.post("/tasks", {
        ...form,
        assigneeId: form.assigneeId.trim() || null,
      });

      setNotice({
        type: "success",
        title: "Tarefa criada",
        message: "A nova tarefa entrou na fila de execução com sucesso.",
      });

      setForm({
        ...initialForm,
        projectId: adminProjects[0]?.id || "",
      });

      await loadTasks({ silent: true });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Não foi possível criar a tarefa",
        message: buildErrorMessage(
          error,
          "A criação da tarefa falhou. Revise os dados e tente novamente."
        ),
      });
    } finally {
      setCreating(false);
    }
  }

  async function changeStatus(taskId: string, status: TaskStatus) {
    try {
      setActiveTaskId(taskId);

      await api.patch(`/tasks/${taskId}/status`, { status });

      setNotice({
        type: "success",
        title: "Status atualizado",
        message: `A tarefa foi movida para "${traduzirStatus(status)}".`,
      });

      await loadTasks({ silent: true });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao atualizar status",
        message: buildErrorMessage(
          error,
          "Não foi possível mover a tarefa agora."
        ),
      });
    } finally {
      setActiveTaskId(null);
    }
  }

  if (loading) {
    return (
      <section className="tasks-page tasks-page--loading">
        <SkeletonBlock className="tasks-loading-hero" />

        <div className="tasks-loading-grid">
          <SkeletonBlock className="tasks-loading-card" />
          <SkeletonBlock className="tasks-loading-card" />
          <SkeletonBlock className="tasks-loading-card" />
          <SkeletonBlock className="tasks-loading-card" />
        </div>

        <SkeletonBlock className="tasks-loading-panel" />
        <SkeletonBlock className="tasks-loading-panel" />
      </section>
    );
  }

  return (
    <section className="tasks-page">
      <PageHero
        eyebrow="Trilha de execução"
        title="Fila operacional de tarefas"
        description="Coordene execução, acompanhe responsáveis e mantenha o ritmo do ambiente com leitura clara de status, carga e andamento."
        chips={["Execução orientada", "Status em tempo real", "Organização por projeto"]}
        sideEyebrow="Saúde do fluxo"
        sideBadge={
          <StatusBadge
            label={refreshing ? "Atualizando..." : metricas.health.label}
            tone={metricas.health.tone}
          />
        }
        sideDescription={metricas.health.text}
        miniStats={[
          { label: "Total", value: metricas.total },
          { label: "Em execução", value: metricas.doing },
          { label: "Concluídas", value: metricas.done },
        ]}
      />

      {notice ? (
        <NoticeBanner
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <section className="tasks-stats-grid">
        <StatCard
          label="A fazer"
          value={metricas.todo}
          description="Itens aguardando entrada no ritmo de execução."
        />

        <StatCard
          label="Em execução"
          value={metricas.doing}
          description="Tarefas em movimento dentro dos projetos ativos."
        />

        <StatCard
          label="Concluídas"
          value={metricas.done}
          description="Volume já entregue e devolvido ao fluxo operacional."
        />

        <StatCard
          label="Total monitorado"
          value={metricas.total}
          description="Leitura consolidada da fila atual de execução."
        />
      </section>

      <div className="tasks-layout">
        {user?.role === "ADMIN" ? (
          <PanelCard
            eyebrow="Nova tarefa"
            title="Criar item de execução"
            subtitle="Registre a atividade com contexto claro para orientar quem vai executar."
          >
            <form className="tasks-form" onSubmit={handleCreate}>
              <Field label="Título">
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Ajustar onboarding do cliente"
                  required
                />
              </Field>

              <Field label="Descrição">
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Descreva o objetivo da tarefa e o contexto esperado"
                  rows={5}
                  required
                />
              </Field>

              <FormRow>
                <Field label="Projeto">
                  <Select
                    value={form.projectId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        projectId: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Selecione um projeto</option>
                    {adminProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Status inicial">
                  <Select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                  >
                    <option value="TODO">A fazer</option>
                    <option value="DOING">Em execução</option>
                    <option value="DONE">Concluída</option>
                  </Select>
                </Field>
              </FormRow>

              <Field label="Responsável">
                <Select
                  value={form.assigneeId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      assigneeId: event.target.value,
                    }))
                  }
                >
                  <option value="">Sem responsável</option>
                  {adminUsers.map((adminUser) => (
                    <option key={adminUser.id} value={adminUser.id}>
                      {adminUser.name} · {adminUser.email}
                    </option>
                  ))}
                </Select>
              </Field>

              <Button type="submit" disabled={creating} fullWidth>
                {creating ? "Criando tarefa..." : "Criar tarefa"}
              </Button>
            </form>
          </PanelCard>
        ) : null}

        <section className="tasks-main-column">
          <PanelCard
            eyebrow="Painel de execução"
            title="Fila de tarefas"
            subtitle="Filtre por status, localize contexto e mova o fluxo com mais clareza."
            stacked
          >
            <div className="tasks-toolbar">
              <Field label="Buscar">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Título, projeto, responsável ou descrição"
                />
              </Field>

              <Field label="Status">
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="ALL">Todos</option>
                  <option value="TODO">A fazer</option>
                  <option value="DOING">Em execução</option>
                  <option value="DONE">Concluída</option>
                </Select>
              </Field>

              <Button
                variant="ghost"
                onClick={() => loadTasks({ silent: true })}
              >
                Atualizar
              </Button>
            </div>

            <div className="tasks-toolbar__meta">
              <span className="tasks-list-count">
                {tarefasFiltradas.length}{" "}
                {tarefasFiltradas.length === 1 ? "item" : "itens"}
              </span>

              {refreshing ? (
                <span className="tasks-refreshing-text">
                  Sincronizando fila...
                </span>
              ) : null}
            </div>
          </PanelCard>

          {tarefasFiltradas.length === 0 ? (
            <article className="tasks-empty-state">
              <EmptyState
                eyebrow="Sem itens"
                title="Nenhuma tarefa encontrada"
                description="Ajuste os filtros ou crie uma nova tarefa para iniciar o fluxo de execução."
              />
            </article>
          ) : (
            <div className="tasks-list">
              {tarefasFiltradas.map((task) => {
                const isBusy = activeTaskId === task.id;

                return (
                  <article className="task-card" key={task.id}>
                    <div className="task-card__header">
                      <div className="task-card__title-block">
                        <div className="task-card__title-row">
                          <h2>{task.title}</h2>
                          <span className="task-card__date">
                            {formatarData(task.dueDate)}
                          </span>
                        </div>

                        <p className="task-card__meta">
                          {task.project.name} • Criado por {task.createdBy.name}
                        </p>
                      </div>

                      <div className="task-card__badges">
                        <StatusBadge
                          label={traduzirStatus(task.status)}
                          tone={mapStatusTone(task.status)}
                        />
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
                      <Button
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => changeStatus(task.id, "TODO")}
                      >
                        {isBusy ? "Movendo..." : "A fazer"}
                      </Button>

                      <Button
                        variant="ghost"
                        className="tasks-action-button--info"
                        disabled={isBusy}
                        onClick={() => changeStatus(task.id, "DOING")}
                      >
                        {isBusy ? "Movendo..." : "Em execução"}
                      </Button>

                      <Button
                        variant="ghost"
                        className="tasks-action-button--success"
                        disabled={isBusy}
                        onClick={() => changeStatus(task.id, "DONE")}
                      >
                        {isBusy ? "Movendo..." : "Concluir"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}