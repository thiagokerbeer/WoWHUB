export function translateTicketStatus(status: string) {
  const map: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em andamento",
    WAITING_RESPONSE: "Aguardando resposta",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado",
  };

  return map[status] || status;
}

export function translateTaskStatus(status: string) {
  const map: Record<string, string> = {
    TODO: "A fazer",
    DOING: "Em execução",
    DONE: "Concluída",
  };

  return map[status] || status;
}

export function translatePriority(priority: string) {
  const map: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica",
  };

  return map[priority] || priority;
}

export function translateActivityAction(action: string) {
  const map: Record<string, string> = {
    "Admin block": "Bloqueio administrativo",
    "Admin unblock": "Desbloqueio administrativo",
    "Admin temp ban": "Banimento temporário",
    "Admin clear ban": "Remoção de banimento",
    "Admin delete user": "Exclusão de usuário",
  };

  return map[action] || action;
}

export function translateUserRole(role: string) {
  return role === "ADMIN" ? "Administrador" : "Usuário";
}
