export type User = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatar?: string | null;
};

export type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

export type DashboardData = {
  metrics: {
    openTickets: number;
    resolvedTickets: number;
    tasksInProgress: number;
    projectsCount: number;
    usersCount: number;
  };
  tickets: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    user: { name: string };
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    project: { name: string };
    assignee?: { name: string } | null;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user: { name: string };
  }>;
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
  comments: Array<{
    id: string;
    message: string;
    createdAt: string;
    user: { name: string; role: string };
  }>;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate?: string | null;
  project: { name: string };
  assignee?: { name: string } | null;
  createdBy: { name: string };
};

export type AdminSnapshot = {
  users: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
  projects: Array<{ id: string; name: string; description: string; status: string }>;
  ticketsByStatus: Array<{ status: string; _count: { status: number } }>;
  tasksByStatus: Array<{ status: string; _count: { status: number } }>;
  activity: Array<{ id: string; action: string; details: string; createdAt: string; user: { name: string } }>;
};
