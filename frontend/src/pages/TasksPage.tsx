import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import { Task } from "../types";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  title: "",
  description: "",
  projectId: "wowhub-project-core",
  status: "TODO",
  assigneeId: ""
};

function traduzirStatus(status: string) {
  const mapa: Record<string, string> = {
    TODO: "A fazer",
    DOING: "Em execução",
    DONE: "Concluída"
  };

  return mapa[status] || status;
}

export function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState(initialForm);

  async function loadTasks() {
    const response = await api.get<Task[]>("/tasks");
    setTasks(response.data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await api.post("/tasks", { ...form, assigneeId: form.assigneeId || null });
    setForm(initialForm);
    loadTasks();
  }

  async function changeStatus(taskId: string, status: string) {
    await api.patch(`/tasks/${taskId}/status`, { status });
    loadTasks();
  }

  return (
    <div className="page-stack">
      <section className="header-card">
        <div>
          <span className="eyebrow">Trilha de execução</span>
          <h1>Tarefas</h1>
          <p>Este módulo adiciona coordenação de projeto e dá mais profundidade de produto ao portfólio.</p>
        </div>
      </section>

      {user?.role === "ADMIN" && (
        <form className="panel-card form-grid" onSubmit={handleCreate}>
          <div className="panel-title-row"><h2>Criar tarefa</h2></div>
          <label>Título<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Descrição<textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="split-grid">
            <label>ID do projeto<input value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} /></label>
            <label>ID do responsável (opcional)<input value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} /></label>
          </div>
          <button className="button-primary">Criar tarefa</button>
        </form>
      )}

      <div className="content-grid">
        {tasks.map((task) => (
          <article className="panel-card" key={task.id}>
            <div className="panel-title-row wrap-gap">
              <div>
                <h2>{task.title}</h2>
                <p>{task.project.name} • Criado por: {task.createdBy.name}</p>
              </div>
              <span className="pill neutral">{traduzirStatus(task.status)}</span>
            </div>
            <p className="body-copy">{task.description}</p>
            <p className="muted-line">Responsável: {task.assignee?.name || "Sem responsável"}</p>
            <div className="action-row">
              <button className="small-button" onClick={() => changeStatus(task.id, "TODO")}>A fazer</button>
              <button className="small-button" onClick={() => changeStatus(task.id, "DOING")}>Em execução</button>
              <button className="small-button" onClick={() => changeStatus(task.id, "DONE")}>Concluir</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
